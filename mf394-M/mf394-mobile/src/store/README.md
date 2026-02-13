# Redux Store

Centralized state management using Redux Toolkit and RTK Query.

## Architecture

```
store/
├── index.ts                    # Store configuration
├── hooks.ts                    # Type-safe Redux hooks
├── slices/
│   ├── auth.slice.ts          # Authentication state
│   ├── ui.slice.ts            # UI state (theme, toasts)
│   └── sync.slice.ts          # Offline sync queue
├── api/
│   ├── contacts.api.ts        # Contacts CRUD endpoints
│   ├── images.api.ts          # Image upload endpoints
│   └── auth.api.ts            # Authentication endpoints
├── middleware/
│   ├── sync.middleware.ts     # Offline queue processing
│   └── errorHandling.middleware.ts  # Global error handling
└── README.md
```

## Quick Start

### Using Redux State

```typescript
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectAuthUser, loginSuccess } from '@/store';

function MyComponent() {
  const user = useAppSelector(selectAuthUser);
  const dispatch = useAppDispatch();

  return <Text>{user?.name}</Text>;
}
```

### Using RTK Query

```typescript
import { useGetContactsQuery, useCreateContactMutation } from '@/store/api/contacts.api';

function ContactList() {
  // RTK Query handles caching, loading, error states automatically
  const { data, isLoading, error } = useGetContactsQuery({ page: 1 });
  const [createContact] = useCreateContactMutation();

  return (
    <FlatList
      data={data?.contacts}
      renderItem={({ item }) => <ContactCard contact={item} />}
    />
  );
}
```

## Slices

### Auth Slice

Manages user authentication state:
- `user` - Current user profile
- `accessToken` - JWT access token
- `refreshToken` - Refresh token for token rotation
- `isAuthenticated` - Boolean flag
- `isLoading` - Loading state
- `error` - Error message

**Actions:**
- `loginStart()` - Start login
- `loginSuccess(user, accessToken, refreshToken)` - Successful login
- `loginFailure(error)` - Login failed
- `logout()` - Clear auth state
- `restoreSession(data)` - Restore from storage
- `updateUser(partial)` - Update user profile
- `setAccessToken(token)` - Update access token

**Selectors:**
- `selectAuth()` - Get full auth state
- `selectAuthUser()` - Get current user
- `selectAuthIsAuthenticated()` - Check if logged in
- `selectAuthLoading()` - Get loading state
- `selectAuthError()` - Get error message

### UI Slice

Manages application UI state:
- `theme` - 'light' or 'dark'
- `toasts` - Array of toast notifications
- `isModalOpen` - Modal visibility
- `modalData` - Modal content data

**Actions:**
- `setTheme(theme)` - Set theme
- `toggleTheme()` - Toggle light/dark
- `addToast(toast)` - Add notification
- `removeToast(id)` - Remove notification
- `clearToasts()` - Clear all notifications
- `openModal(data)` - Open modal with data
- `closeModal()` - Close modal

**Selectors:**
- `selectUITheme()` - Get theme
- `selectUIToast()` - Get toasts

### Sync Slice

Manages offline sync queue:
- `queue` - Array of queued mutations
- `isSyncing` - Currently syncing
- `errors` - Sync errors
- `lastSyncTime` - Last successful sync

**Actions:**
- `addToQueue(mutation)` - Add to queue
- `removeFromQueue(id)` - Remove from queue
- `clearQueue()` - Clear all queued items
- `updateQueuedMutation(id, update)` - Update queued item
- `setSyncing(boolean)` - Set syncing status
- `addSyncError(error)` - Add error
- `removeSyncError(id)` - Remove error
- `clearSyncErrors()` - Clear all errors
- `resetSync()` - Reset sync state

**Selectors:**
- `selectSync()` - Get full sync state
- `selectSyncQueue()` - Get queue
- `selectSyncIsSyncing()` - Get syncing status
- `selectSyncErrors()` - Get errors

## APIs (RTK Query)

### Contacts API

CRUD operations for contacts with automatic caching.

**Endpoints:**
- `getContacts(page, limit, search)` - List contacts
- `getContactById(id)` - Get single contact
- `createContact(data)` - Create contact
- `updateContact(id, data)` - Update contact
- `deleteContact(id)` - Delete contact
- `deleteContacts(ids)` - Batch delete

**Hooks:**
- `useGetContactsQuery()`
- `useGetContactByIdQuery()`
- `useCreateContactMutation()`
- `useUpdateContactMutation()`
- `useDeleteContactMutation()`
- `useDeleteContactsMutation()`

### Images API

Upload and manage images with automatic caching.

**Endpoints:**
- `getImages(page, limit)` - List images
- `getContactImages(contactId)` - Get contact images
- `getImageById(id)` - Get single image
- `uploadImage(file, contactId, metadata)` - Upload image
- `deleteImage(id)` - Delete image
- `deleteImages(ids)` - Batch delete
- `updateImage(id, metadata)` - Update metadata

**Hooks:**
- `useGetImagesQuery()`
- `useGetContactImagesQuery()`
- `useGetImageByIdQuery()`
- `useUploadImageMutation()`
- `useDeleteImageMutation()`
- `useDeleteImagesMutation()`
- `useUpdateImageMutation()`

### Auth API

Authentication operations.

**Endpoints:**
- `login(provider, idToken)` - Login with social provider
- `logout()` - Logout
- `refreshToken(refreshToken)` - Refresh access token
- `getCurrentUser()` - Get current user
- `updateProfile(data)` - Update profile
- `verifySession()` - Verify stored session

**Hooks:**
- `useLoginMutation()`
- `useLogoutMutation()`
- `useRefreshTokenMutation()`
- `useGetCurrentUserQuery()`
- `useUpdateProfileMutation()`
- `useVerifySessionQuery()`

## Middleware

### Sync Middleware

Processes offline sync queue when:
1. App comes online
2. Auth token is refreshed
3. Login succeeds
4. Session is restored

Automatically retries failed mutations with exponential backoff.

### Error Handling Middleware

Intercepts all API errors and:
1. Shows user-friendly toast messages
2. Handles 401/403 errors specially
3. Logs errors for debugging
4. Triggers logout on auth errors

## Offline-First Architecture

### How It Works

1. **Queue Mutations** - When offline, mutations are queued in Redux state
2. **Persist Queue** - Queue is saved to device storage (localStorage/AsyncStorage)
3. **Monitor Connectivity** - App detects when connection is restored
4. **Process Queue** - Sync middleware processes queued mutations in order
5. **Conflict Resolution** - Detects and resolves conflicts between queued mutations
6. **Retry Failed Mutations** - Automatically retries with backoff
7. **Update UI** - Toast notifications inform user of sync progress

### Using Offline Mutations

```typescript
import { useCreateContactMutation } from '@/store/api/contacts.api';
import { useAppDispatch } from '@/store/hooks';
import { SyncQueueService } from '@/services/syncQueue.service';
import { addToQueue } from '@/store/slices/sync.slice';

function AddContactForm() {
  const [createContact] = useCreateContactMutation();
  const dispatch = useAppDispatch();
  const isOnline = useIsOnline(); // Hook to check connectivity

  async function handleAddContact(data) {
    try {
      if (isOnline) {
        // Online - make request immediately
        await createContact(data).unwrap();
      } else {
        // Offline - queue the mutation
        const mutation = SyncQueueService.createQueuedMutation(
          'contacts/createContact',
          data
        );
        dispatch(addToQueue(mutation));

        // Show toast
        dispatch(addToast({
          id: uuidv4(),
          type: 'info',
          message: 'Saved offline. Will sync when online.',
          duration: 3000,
        }));
      }
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  }

  return <ContactForm onSubmit={handleAddContact} />;
}
```

## Tips & Best Practices

### ✅ Do

- Use `useAppSelector` and `useAppDispatch` for type safety
- Use RTK Query for all API calls
- Let middleware handle errors automatically
- Queue mutations when offline
- Use selector shortcuts for common state access
- Leverage automatic cache invalidation with tags

### ❌ Don't

- Don't use `useSelector` or `useDispatch` directly
- Don't make direct fetch calls (use RTK Query)
- Don't try to manually manage API loading states (RTK Query does it)
- Don't forget to tag endpoints for cache invalidation
- Don't queue mutations for read-only queries

## See Also

- `src/theme/Themes.ts` - Design tokens
- `src/services/syncQueue.service.ts` - Sync queue utilities
- `src/hooks/` - Custom hooks
- `src/components/` - UI components
