/**
 * Contacts API Tests
 *
 * Tests for RTK Query mutation request format, category transforms,
 * and cache invalidation behaviour.
 */

import { configureStore } from '@reduxjs/toolkit';
import { contactsApi } from './contacts.api';

// ---------------------------------------------------------------------------
// Store helpers
// ---------------------------------------------------------------------------

function createTestStore(token = 'test-token') {
  return configureStore({
    reducer: {
      auth: (state = { token, isAuthenticated: true, user: null, isLoading: false, error: null }) => state,
      [contactsApi.reducerPath]: contactsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(contactsApi.middleware),
  });
}

// ---------------------------------------------------------------------------
// fetch mock helpers
// ---------------------------------------------------------------------------

type FetchMock = jest.MockedFunction<typeof global.fetch>;

/**
 * RTK Query's fetchBaseQuery calls response.clone() internally.
 * Each call to mockFetchSuccess returns a factory so clone() works correctly.
 */
function mockFetchSuccess(body: object) {
  const makeResponse = () => ({
    ok: true,
    status: 200,
    headers: { get: (key: string) => (key === 'content-type' ? 'application/json' : null) },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    clone() { return makeResponse(); },
  });
  (global.fetch as FetchMock).mockResolvedValueOnce(makeResponse() as unknown as Response);
}

/**
 * RTK Query calls fetch(new Request(url, init)) — a single Request argument.
 * This helper reads URL, method, body, and headers from that Request object.
 */
async function getLastRequest() {
  const calls = (global.fetch as FetchMock).mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  const req = calls[0][0] as Request;
  const url = req.url;
  const method = req.method;
  let body: any;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = undefined;
  }
  const headers: Record<string, string> = {};
  req.headers?.forEach((v: string, k: string) => { headers[k] = v; });
  return { url, method, body, headers };
}

beforeEach(() => {
  global.fetch = jest.fn() as FetchMock;
});

afterEach(() => {
  jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// createContact
// ---------------------------------------------------------------------------

describe('createContact mutation', () => {
  it('wraps request body in { contact: {...} }', async () => {
    mockFetchSuccess({
      message: 'Contact added successfully.',
      contact: {
        _id: 'new-id',
        name: 'Alice',
        hint: 'tall',
        category: 'Family',
        groups: [],
        created: 1000,
        edited: 1000,
      },
    });

    const store = createTestStore();
    await store.dispatch(
      contactsApi.endpoints.createContact.initiate({
        name: 'Alice',
        hint: 'tall',
        category: 'friends-family',
        groups: [],
      })
    );

    const { body } = await getLastRequest();
    expect(body).toHaveProperty('contact');
    expect(body.contact).toHaveProperty('name', 'Alice');
  });

  it('transforms category to Title Case in outgoing request', async () => {
    mockFetchSuccess({
      message: 'Contact added successfully.',
      contact: {
        _id: 'new-id',
        name: 'Bob',
        category: 'Family',
        groups: [],
        created: 1000,
        edited: 1000,
      },
    });

    const store = createTestStore();
    await store.dispatch(
      contactsApi.endpoints.createContact.initiate({
        name: 'Bob',
        category: 'friends-family',
        groups: [],
      })
    );

    const { body } = await getLastRequest();
    expect(body.contact.category).toBe('Family');
  });

  it('transforms category from API (Title Case → kebab-case) in response', async () => {
    mockFetchSuccess({
      message: 'Contact added successfully.',
      contact: {
        _id: 'new-id',
        name: 'Charlie',
        category: 'Work',
        groups: [],
        created: 1000,
        edited: 1000,
      },
    });

    const store = createTestStore();
    const result = await store.dispatch(
      contactsApi.endpoints.createContact.initiate({
        name: 'Charlie',
        category: 'work',
        groups: [],
      })
    );

    expect((result as any).data?.category).toBe('work');
  });

  it('does NOT include _id in create request body', async () => {
    mockFetchSuccess({
      message: 'Contact added successfully.',
      contact: {
        _id: 'auto-generated',
        name: 'Dave',
        category: 'Community',
        groups: [],
        created: 1000,
        edited: 1000,
      },
    });

    const store = createTestStore();
    await store.dispatch(
      contactsApi.endpoints.createContact.initiate({
        name: 'Dave',
        category: 'community',
        groups: [],
      })
    );

    const { body } = await getLastRequest();
    expect(body.contact._id).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// updateContact
// ---------------------------------------------------------------------------

describe('updateContact mutation', () => {
  it('wraps request body in { contact: { _id, ...fields } }', async () => {
    mockFetchSuccess({ message: 'Contact updated successfully.' });

    const store = createTestStore();
    await store.dispatch(
      contactsApi.endpoints.updateContact.initiate({
        id: 'abc-123',
        data: { name: 'Eve Updated', category: 'work', groups: [] },
      })
    );

    const { body } = await getLastRequest();
    expect(body).toHaveProperty('contact');
    expect(body.contact._id).toBe('abc-123');
    expect(body.contact.name).toBe('Eve Updated');
  });

  it('transforms category to Title Case in outgoing update request', async () => {
    mockFetchSuccess({ message: 'Contact updated successfully.' });

    const store = createTestStore();
    await store.dispatch(
      contactsApi.endpoints.updateContact.initiate({
        id: 'abc-123',
        data: { name: 'Frank', category: 'goals-hobbies', groups: [] },
      })
    );

    const { body } = await getLastRequest();
    expect(body.contact.category).toBe('Pursuits');
  });

  it('sends PUT to /contacts endpoint', async () => {
    mockFetchSuccess({ message: 'Contact updated successfully.' });

    const store = createTestStore();
    await store.dispatch(
      contactsApi.endpoints.updateContact.initiate({
        id: 'abc-123',
        data: { name: 'Grace', category: 'community', groups: [] },
      })
    );

    const { url, method } = await getLastRequest();
    expect(url).toContain('/contacts');
    expect(method).toBe('PUT');
  });
});

// ---------------------------------------------------------------------------
// deleteContact
// ---------------------------------------------------------------------------

describe('deleteContact mutation', () => {
  it('sends DELETE request to /contacts?id={id}', async () => {
    mockFetchSuccess({ message: 'Contact deleted successfully' });

    const store = createTestStore();
    await store.dispatch(
      contactsApi.endpoints.deleteContact.initiate('contact-xyz')
    );

    const { url, method } = await getLastRequest();
    expect(url).toContain('/contacts?id=contact-xyz');
    expect(method).toBe('DELETE');
  });
});

// ---------------------------------------------------------------------------
// Authorization header
// ---------------------------------------------------------------------------

describe('Authorization header', () => {
  it('includes Bearer token in create request', async () => {
    mockFetchSuccess({
      message: 'Contact added successfully.',
      contact: { _id: 'new', name: 'Henry', category: 'Family', groups: [], created: 0, edited: 0 },
    });

    const store = createTestStore('my-secret-token');
    await store.dispatch(
      contactsApi.endpoints.createContact.initiate({ name: 'Henry', category: 'friends-family', groups: [] })
    );

    const { headers } = await getLastRequest();
    const authEntry = Object.entries(headers).find(
      ([k]) => k.toLowerCase() === 'authorization'
    );
    expect(authEntry).toBeDefined();
    expect(authEntry![1]).toBe('Bearer my-secret-token');
  });
});
