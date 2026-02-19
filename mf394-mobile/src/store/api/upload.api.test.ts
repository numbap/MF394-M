/**
 * Upload API Tests
 *
 * Tests for:
 *  - getBase64FromUri helper (data URL, web fetch, native ImageManipulator)
 *  - uploadImage mutation request body shape ({ fileName, fileType, fileContent })
 *  - Authorization header
 *  - Error handling
 *
 * RTK Query v1 calls fetch(Request) with a single Request object.
 * We read outgoing request properties (body, headers, url, method) from that
 * Request object rather than from the second fetch argument.
 */

import { configureStore } from '@reduxjs/toolkit';
import { uploadApi, getBase64FromUri } from './upload.api';

// ---------------------------------------------------------------------------
// Platform mock (default: web)
// ---------------------------------------------------------------------------

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

// ---------------------------------------------------------------------------
// Store helpers
// ---------------------------------------------------------------------------

function createTestStore(token = 'test-token') {
  return configureStore({
    reducer: {
      auth: (
        state = { token, isAuthenticated: true, user: null, isLoading: false, error: null }
      ) => state,
      [uploadApi.reducerPath]: uploadApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(uploadApi.middleware),
  });
}

// ---------------------------------------------------------------------------
// fetch mock helpers
//
// RTK Query calls response.clone() before reading the response body.
// The mock response must include a clone() method.
// ---------------------------------------------------------------------------

type FetchMock = jest.MockedFunction<typeof global.fetch>;

function mockFetchSuccess(body: object) {
  const bodyStr = JSON.stringify(body);
  (global.fetch as FetchMock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    clone: function () { return this; },
    headers: { get: (key: string) => (key === 'content-type' ? 'application/json' : null) },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(bodyStr),
  } as unknown as Response);
}

/**
 * Reads the outgoing request body from the captured Request object.
 * RTK Query calls fetch(Request), so mock.calls[0][0] is the Request.
 */
async function getCapturedRequestBody(): Promise<any> {
  const request = (global.fetch as FetchMock).mock.calls[0][0] as Request;
  const bodyStr = await request.text();
  return JSON.parse(bodyStr);
}

function getCapturedRequestUrl(): string {
  const request = (global.fetch as FetchMock).mock.calls[0][0] as Request;
  return request.url;
}

function getCapturedRequestMethod(): string {
  const request = (global.fetch as FetchMock).mock.calls[0][0] as Request;
  return request.method;
}

function getCapturedRequestHeader(name: string): string | null {
  const request = (global.fetch as FetchMock).mock.calls[0][0] as Request;
  return request.headers.get(name);
}

beforeEach(() => {
  global.fetch = jest.fn() as FetchMock;
});

afterEach(() => {
  jest.resetAllMocks();
  jest.resetModules();
});

// ---------------------------------------------------------------------------
// getBase64FromUri — data URL path
// ---------------------------------------------------------------------------

describe('getBase64FromUri', () => {
  it('extracts base64 and mime type from a data URL without fetching', async () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/abc123==';
    const result = await getBase64FromUri(dataUrl);

    expect(result.base64).toBe('/9j/abc123==');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.fileName).toBe('upload.jpeg');
    // fetch should NOT have been called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles data URL with png mime type', async () => {
    const dataUrl = 'data:image/png;base64,iVBORabc==';
    const result = await getBase64FromUri(dataUrl);

    expect(result.mimeType).toBe('image/png');
    expect(result.fileName).toBe('upload.png');
  });

  it('falls back to image/jpeg when mime type is absent in data URL', async () => {
    // Malformed but shouldn't crash
    const dataUrl = 'data:;base64,abc123';
    const result = await getBase64FromUri(dataUrl);

    expect(result.mimeType).toBe('image/jpeg');
  });

  it('fetches a web URL and reads it via FileReader', async () => {
    const blobContent = 'fake-image-data';
    const mockBlob = { type: 'image/jpeg' };

    (global.fetch as FetchMock).mockResolvedValueOnce({
      blob: () => Promise.resolve(mockBlob),
    } as unknown as Response);

    const mockReadAsDataURL = jest.fn();
    const mockFileReader = {
      onloadend: null as any,
      onerror: null as any,
      result: `data:image/jpeg;base64,${btoa(blobContent)}`,
      readAsDataURL: mockReadAsDataURL.mockImplementation(function (this: any) {
        setTimeout(() => this.onloadend(), 0);
      }),
    };
    (global as any).FileReader = jest.fn(() => mockFileReader);

    const result = await getBase64FromUri('https://example.com/photo.jpg');

    expect(result.base64).toBe(btoa(blobContent));
    expect(result.mimeType).toBe('image/jpeg');
  });
});

// ---------------------------------------------------------------------------
// uploadImage mutation — request body shape
// ---------------------------------------------------------------------------

describe('uploadImage mutation', () => {
  it('sends { fileName, fileType, fileContent } in the request body', async () => {
    mockFetchSuccess({ url: 'https://s3.example.com/abc.jpg' });

    const store = createTestStore();
    const dataUrl = 'data:image/jpeg;base64,/9j/TESTBASE64==';

    await store.dispatch(
      uploadApi.endpoints.uploadImage.initiate({ uri: dataUrl })
    );

    const body = await getCapturedRequestBody();

    expect(body).toHaveProperty('fileName');
    expect(body).toHaveProperty('fileType');
    expect(body).toHaveProperty('fileContent');
  });

  it('does NOT send { image } or { metadata } in the request body', async () => {
    mockFetchSuccess({ url: 'https://s3.example.com/abc.jpg' });

    const store = createTestStore();
    await store.dispatch(
      uploadApi.endpoints.uploadImage.initiate({ uri: 'data:image/jpeg;base64,/9j/TESTBASE64==' })
    );

    const body = await getCapturedRequestBody();

    expect(body).not.toHaveProperty('image');
    expect(body).not.toHaveProperty('metadata');
  });

  it('sends the correct base64 content from a data URL', async () => {
    mockFetchSuccess({ url: 'https://s3.example.com/abc.jpg' });

    const store = createTestStore();
    const base64Payload = '/9j/TESTBASE64==';
    const dataUrl = `data:image/jpeg;base64,${base64Payload}`;

    await store.dispatch(
      uploadApi.endpoints.uploadImage.initiate({ uri: dataUrl })
    );

    const body = await getCapturedRequestBody();

    expect(body.fileContent).toBe(base64Payload);
    expect(body.fileType).toBe('image/jpeg');
  });

  it('sends POST to /upload endpoint', async () => {
    mockFetchSuccess({ url: 'https://s3.example.com/abc.jpg' });

    const store = createTestStore();
    await store.dispatch(
      uploadApi.endpoints.uploadImage.initiate({ uri: 'data:image/jpeg;base64,abc' })
    );

    expect(getCapturedRequestUrl()).toContain('/upload');
    expect(getCapturedRequestMethod()).toBe('POST');
  });

  it('stores the returned S3 url in Redux state', async () => {
    const s3Url = 'https://s3.example.com/photo-abc123.jpg';
    mockFetchSuccess({ url: s3Url });

    const store = createTestStore();
    await store.dispatch(
      uploadApi.endpoints.uploadImage.initiate({ uri: 'data:image/jpeg;base64,abc' })
    );

    // RTK Query stores the mutation result in Redux state.
    // (The dispatch return value is affected by a test-env middleware issue;
    //  reading from store state is the reliable approach.)
    const mutations = (store.getState() as any)[uploadApi.reducerPath]?.mutations ?? {};
    const firstKey = Object.keys(mutations)[0];
    expect(mutations[firstKey]?.data?.url).toBe(s3Url);
  });
});

// ---------------------------------------------------------------------------
// Authorization header
// ---------------------------------------------------------------------------

describe('Authorization header', () => {
  it('includes Bearer token in upload request', async () => {
    mockFetchSuccess({ url: 'https://s3.example.com/abc.jpg' });

    const store = createTestStore('my-upload-token');
    await store.dispatch(
      uploadApi.endpoints.uploadImage.initiate({ uri: 'data:image/jpeg;base64,abc' })
    );

    const auth = getCapturedRequestHeader('authorization');
    expect(auth).toBe('Bearer my-upload-token');
  });

  it('omits Authorization header when no token in store', async () => {
    mockFetchSuccess({ url: 'https://s3.example.com/abc.jpg' });

    const store = createTestStore('');
    await store.dispatch(
      uploadApi.endpoints.uploadImage.initiate({ uri: 'data:image/jpeg;base64,abc' })
    );

    const auth = getCapturedRequestHeader('authorization');
    expect(auth).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('uploadImage error handling', () => {
  it('stores a CUSTOM_ERROR in Redux state when getBase64FromUri throws', async () => {
    // Make fetch throw when reading the URI (non-data URL, web path)
    (global.fetch as FetchMock).mockRejectedValueOnce(new Error('Network error'));

    const store = createTestStore();
    await store.dispatch(
      uploadApi.endpoints.uploadImage.initiate({ uri: 'https://example.com/broken.jpg' })
    );

    const mutations = (store.getState() as any)[uploadApi.reducerPath]?.mutations ?? {};
    const firstKey = Object.keys(mutations)[0];
    expect(mutations[firstKey]?.error?.status).toBe('CUSTOM_ERROR');
  });
});
