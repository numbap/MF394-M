# Components

UI-only, reusable components with zero business logic.

## Rules

- **UI Only**: No business logic, API calls, or Redux access
- **Pure**: Must be reusable across screens
- **Testable**: Every component has a test file
- **Themed**: All colors/spacing come from `theme.ts` only
- **Small**: Max 200 lines per component, max 8 props
- **One per file**: Single responsibility principle
- **Auto-added to Palette**: Every component auto-appears in the component gallery

## File Structure

Each component must follow this structure:

```
ComponentName/
├── ComponentName.tsx      # Main component (≤ 200 lines)
├── index.ts               # Re-export for clean imports
└── ComponentName.test.tsx  # Unit tests
```

## Exports

```typescript
// index.ts example
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

## Props Contract

Components accept only what they need:

```typescript
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  isLoading?: boolean;
}
```

## Theming

**❌ Wrong:**
```typescript
const backgroundColor = '#547fab'; // Hardcoded color
const margin = 16; // Magic number
```

**✅ Right:**
```typescript
import { theme } from '@/theme';

const backgroundColor = theme.colors.primary[500];
const margin = theme.spacing.md;
```

## Testing

Every component must have:
- Default state
- Loading state (if applicable)
- Disabled state
- Error state (if applicable)
- All variants

```typescript
// ComponentName.test.tsx
describe('ComponentName', () => {
  it('renders default state', () => { ... });
  it('handles press events', () => { ... });
  it('respects disabled prop', () => { ... });
});
```

## No Imports From

- ❌ `src/screens/` - Screen logic doesn't belong in components
- ❌ Redux directly - Use hooks if needed, but prefer prop passing
- ❌ API services - No data fetching here

## OK to Import From

- ✅ `src/theme/` - Design tokens
- ✅ `src/hooks/` - Custom hooks (but keep it simple)
- ✅ React Native
- ✅ Other components (composition)

## Component Checklist

Before submitting a component:

- [ ] Follows file structure
- [ ] ≤ 200 lines
- [ ] ≤ 8 props
- [ ] All colors from theme
- [ ] All spacing from theme
- [ ] Has test file
- [ ] Tests cover all states
- [ ] No business logic
- [ ] No API calls
- [ ] No Redux access
- [ ] Exported from index.ts
- [ ] Appears in Palette screen

## Examples

See existing components in this folder for patterns and conventions.
