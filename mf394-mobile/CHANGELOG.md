# Changelog

## [Unreleased]

### Fixed (iOS Debugging — 2026-02-19)
- Updated 13 packages to Expo SDK 54 compatible versions (`react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`, `expo-image-picker`, `expo-image-manipulator`, `expo-auth-session`, `expo-haptics`, `expo-av`, `expo-status-bar`, `@react-native-async-storage/async-storage`, `@react-native-community/netinfo`)
- Restored `react-native-reanimated/plugin` in `babel.config.js` (removal was causing launch crashes on iOS)
- Added `expo-file-system` to dependencies (required by `MobileCropper` at runtime)
- Removed invalid `ios.supportsTabletMode` and `ios.deploymentTarget` fields from `app.json`
- Created placeholder icon/favicon assets (`assets/icon.png`, `assets/favicon.png`)
- Added `.nvmrc` pinned to Node 20.20.0 (metro 0.83.3 requires Node ≥20)
- Re-added `AUTH_MOCK` support (`AUTH_MOCK=true` in `.env` logs in instantly with a dev user — required for Expo Go testing since `expo-auth-session` v7 removed the proxy)
- Fixed OAuth redirect URI in `useGoogleAuth.ts` to use Google's reverse-client-ID scheme (`com.googleusercontent.apps.{id}:/`) for native builds; added Expo Go guard with clear error message
- Added `AUTH_MOCK` to `constants.js` and `__tests__/mocks/env.mock.js`

### Removed
- `AUTH_MOCK` environment variable and all mock/dummy data code paths
- `src/mock_user.json` - static mock data file
- Offline-first sync infrastructure:
  - `src/services/syncQueue.service.ts` - sync queue service
  - `src/store/middleware/sync.middleware.ts` - Redux sync middleware
  - `src/store/slices/sync.slice.ts` - sync Redux slice
  - `src/store/api/images.api.ts` - old images RTK Query API
- `refreshToken` / `accessToken` auth fields replaced by single `token`
- `setAccessToken` Redux action (no longer needed)
- `StorageService.loadContacts()`, `saveContacts()`, `clearContacts()` (data now served via API)
- `StorageService.loadFilters()` offline mock bypass

### Fixed
- `upload.api.ts` — request body was `{ image, metadata }` but live API requires `{ fileName, fileType, fileContent }`. Fixed to match server contract.
- `upload.api.ts` — `FileReader` (browser-only) was used on all platforms. Native now uses `expo-image-manipulator` with `base64: true`; web data-URLs bypass fetch entirely. Party Mode saves now work on iOS/Android.

### Added
- `src/store/api/upload.api.test.ts` — new test suite verifying upload request body shape, auth header, URL response, and error handling.
- `getBase64FromUri` exported helper in `upload.api.ts` for platform-safe base64 conversion.

- `src/utils/categoryMapper.ts` - Maps between app kebab-case category format and API Title Case format
- `src/utils/categoryMapper.test.ts` - Full test coverage for category mapping
- `src/store/api/tags.api.ts` - RTK Query endpoints for GET/POST/DELETE `/api/tags`
- `src/store/api/upload.api.ts` - RTK Query endpoint for image upload via `/api/upload` (base64)
- `src/hooks/useNetworkStatus.ts` - Real-time network connectivity detection via `@react-native-community/netinfo`
- `src/hooks/useNetworkStatus.test.ts` - Tests for network status hook
- `src/components/OfflineBanner/` - Persistent banner shown when device is offline
- `__tests__/mocks/netinfo.mock.js` - Jest mock for `@react-native-community/netinfo`
- `SessionRestorer` component in `App.js` - Validates stored JWT token on startup via `/api/user`

### Changed
- `src/store/slices/auth.slice.ts` - Single `token` field (no separate access/refresh tokens); simplified `User` interface
- `src/store/api/contacts.api.ts` - Updated to live API endpoints (`PUT /api/contacts`, `DELETE /api/contacts?id=`); added category mapping in request/response transforms; auth header uses `state.auth.token`
- `src/store/api/auth.api.ts` - `login` endpoint calls `POST /api/auth/mobile-login`; `getUser` calls `GET /api/user`
- `src/store/index.ts` - Removed sync infrastructure; added `tagsApi` and `uploadApi`
- `src/utils/constants.js` - Removed `AUTH_MOCK`; updated `API_ENDPOINTS` to match live API paths
- `src/services/storage.service.ts` - Removed `AUTH_MOCK` conditionals; stripped contact storage methods
- `src/utils/secureStore.js` - Primary methods renamed to `getToken()`/`setToken()`/`clearToken()`
- `src/hooks/useGoogleAuth.ts` - Calls `login` mutation with Google `idToken`; stores single JWT token
- `src/screens/Auth/LoginScreen.js` - Removed mock sign-in; uses real `useGoogleAuth` hook
- `src/screens/Listing/ListingScreen.tsx` - Uses `useGetUserQuery()` for data; Add/Party buttons disabled when offline
- `src/screens/AddEdit/AddEditContactScreen.tsx` - Uses RTK Query mutations; navigation only occurs after successful save
- `src/screens/Party/PartyModeScreen.tsx` - Uses RTK Query mutations; sequential batch create with partial failure handling
- `src/screens/Settings/SettingsScreen.tsx` - Local logout using `tokenStorage.clearToken()` + `dispatch(logout())`
- `src/navigation/RootNavigator.js` - Added `<OfflineBanner />` above navigation
- `src/App.js` - Added session restore on app launch
- `src/services/apiClient.js` - Uses `tokenStorage.getToken()`; removed refresh token logic
- `.env` - Removed `AUTH_MOCK`; API configured via `API_DOMAIN`
- Test files updated for new architecture (mocking RTK Query hooks instead of Redux dispatches)

### Fixed
- Navigation guard in AddEdit and PartyMode screens - only navigates after successful API mutation
- Category format mismatch between app (kebab-case) and API (Title Case) now handled by `categoryMapper`
- Write actions (Add, Party Mode) properly blocked when device is offline
- `QuizGameScreen`: contacts now sourced from RTK Query (`useGetUserQuery`) instead of empty Redux slice
- `QuizGameScreen`: wrapped `allContacts` in `useMemo` to prevent infinite re-render loop when `userData` is undefined
- `QuizGameScreen`: dispatch `markFiltersLoaded()` on AsyncStorage load failure so loading spinner resolves
- `contacts.api.ts`: `createContact` and `updateContact` mutations now wrap body in `{ contact: {...} }` as required by the live API
- `contacts.api.ts`: `createContact` `transformResponse` now unwraps `response.contact`; `updateContact` no longer tries to transform a `{ message }` response
- `filters.slice.ts`: reducers now spread plain arrays before passing to `StorageService.saveFilters` to prevent immer draft proxies escaping the reducer

### Added
- `src/store/api/contacts.api.test.ts` — tests verifying request body format, category transformation, auth headers, and cache invalidation for all three mutations
- `src/screens/AddEdit/AddEditContactScreen.test.tsx` — tests for mutation call shape (`{ contact: {...} }` wrapper) and delete flow
