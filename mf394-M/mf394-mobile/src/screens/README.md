# Screens

Compose components, hooks, and services into user-facing screens.

## Rules

- **Compose, Don't Create**: Use components to build screens
- **Business Logic**: OK to access Redux, services, and hooks
- **No Reusable UI**: Don't create components here
- **One Screen Per Folder**: Clear organization
- **Testable**: Every screen has tests
- **No Inline Styling**: Use theme tokens via hooks

## File Structure

```
ScreenName/
├── ScreenName.tsx         # Main screen component
├── useScreenLogic.ts      # (Optional) Custom hook for logic
├── ScreenName.test.tsx    # Unit and integration tests
└── README.md              # (Optional) Screen-specific docs
```

## Screen Template

```typescript
// screens/ContactList/ContactList.tsx
import { useAppSelector } from '@/store/hooks';
import { useContactsQuery } from '@/store/api';
import { ContactCard } from '@/components';
import { theme } from '@/theme';
import { StyleSheet, View, FlatList } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.md,
  },
});

export function ContactList() {
  const { data: contacts, isLoading } = useContactsQuery();

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        renderItem={({ item }) => <ContactCard contact={item} />}
        keyExtractor={(item) => item.id}
        onEndReached={loadMore}
      />
    </View>
  );
}
```

## OK to Use Here

- ✅ Redux hooks (`useAppSelector`, `useAppDispatch`)
- ✅ RTK Query hooks (`useContactsQuery`, etc.)
- ✅ Custom hooks from `src/hooks/`
- ✅ Services from `src/services/`
- ✅ Components from `src/components/`
- ✅ Navigation

## DO NOT

- ❌ Create new UI components here
- ❌ Make direct API calls
- ❌ Use inline styles (use theme)
- ❌ Hardcode colors or spacing
- ❌ Put business logic in JSX (move to hooks or services)

## Testing

Screens should test:
- Rendering with data
- Loading states
- Error states
- User interactions
- Redux state integration
- Navigation

```typescript
// ScreenName.test.tsx
import { render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ContactList } from './ContactList';

describe('ContactList', () => {
  it('renders list of contacts', async () => {
    render(
      <Provider store={store}>
        <ContactList />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/John Doe/)).toBeTruthy();
    });
  });
});
```

## Navigation Integration

Screens are registered in Expo Router. See `src/app/` for navigation setup.

## Performance Notes

- Use `React.memo()` for expensive renders
- Use `useMemo()` for derived data
- Use `useCallback()` for event handlers
- Avoid passing objects as props without memoization

## Anti-Patterns

**❌ Direct API calls:**
```typescript
useEffect(() => {
  fetch('/api/contacts')
    .then(r => r.json())
    .then(setContacts);
}, []);
```

**✅ Use RTK Query:**
```typescript
const { data: contacts } = useContactsQuery();
```

**❌ Business logic in JSX:**
```typescript
<View>{isAdmin && isLoggedIn && hasPermission ? <Button /> : null}</View>
```

**✅ Extract to hook:**
```typescript
const showButton = useCanDeleteContact(contact.id);
return <View>{showButton && <Button />}</View>;
```

## Checklist

- [ ] Composes components, doesn't create them
- [ ] Uses Redux/RTK Query for data
- [ ] No inline styles
- [ ] All colors/spacing from theme
- [ ] Has test file
- [ ] Tests cover loading/error/success states
- [ ] No direct API calls
- [ ] Exported from route

## See Also

- `src/components/` - UI components
- `src/hooks/` - Business logic hooks
- `src/store/` - Redux setup
- `src/services/` - API and sync services
