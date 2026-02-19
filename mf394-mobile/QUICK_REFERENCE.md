# Quick Reference - Remember Faces App

## 🚀 Start Development

```bash
# Start in web browser (RECOMMENDED)
npm start -- --web
# Opens automatically at http://localhost:8081

# Or interactively choose:
npm start
# Press 'w' for web, 'i' for iOS, 'a' for Android
```

## 📱 View Running App

- **Web:** http://localhost:8081
- **Status:** ✅ **RUNNING NOW**
- **Hot Reload:** Enabled (changes appear instantly)

## 📁 Key Directories

```
src/
├── components/    - Reusable UI (ContactCard, etc)
├── screens/       - Feature screens (LoginScreen, etc)
├── hooks/         - Logic hooks (useGoogleAuth, etc)
├── services/      - API & storage (imageService, etc)
├── store/         - Redux + RTK Query
├── theme/         - Design tokens
└── utils/         - Helpers & constants
```

## 🎨 Design Tokens

Everything uses the theme system. Never hardcode colors!

```typescript
// Good ✅
<View style={{ backgroundColor: colors.primary[500] }} />

// Bad ❌
<View style={{ backgroundColor: "#547fab" }} />
```

Available tokens in `src/theme/theme.ts`:
- `colors` - 50+ colors
- `spacing` - XS, SM, MD, LG, XL, XXL, XXXL, HUGE
- `radii` - XS, SM, MD, LG, XL, FULL
- `typography` - Display, Headline, Title, Body, Label
- `shadows` - NONE, XS, SM, MD, LG, XL

## 📝 Edit Code

### Add a New Component

```bash
# 1. Create component folder
mkdir src/components/MyComponent

# 2. Create 3 files:
# - MyComponent.tsx (main component, <200 lines)
# - index.ts (export)
# - MyComponent.test.tsx (tests)

# 3. Example MyComponent.tsx:
import React from 'react';
import { View, Text } from 'react-native';
import { colors, spacing } from '../../theme/theme';

export interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  return (
    <View style={{ padding: spacing.md }}>
      <Text style={{ color: colors.semantic.text }}>{title}</Text>
    </View>
  );
}
```

### Add a New Screen

```bash
# 1. Create screen folder
mkdir src/screens/MyScreen

# 2. Create screen file
touch src/screens/MyScreen/MyScreen.tsx

# 3. Add to navigation (src/navigation/RootNavigator.js)
import MyScreen from "../screens/MyScreen/MyScreen";

<Stack.Screen name="MyScreen" component={MyScreen} />
```

### Update Redux State

1. Modify `/src/store/slices/yourSlice.ts`
2. Use `useAppDispatch()` and `useAppSelector()` in components
3. Don't use raw `useDispatch()` or `useSelector()`

```typescript
// In component:
const dispatch = useAppDispatch();
const user = useAppSelector(state => state.auth.user);

// Dispatch actions:
dispatch(loginSuccess({ user, token }));
```

## 🔧 Common Commands

```bash
# Code quality
npm run lint           # Run ESLint with auto-fix
npm test              # Run Jest tests

# Development
npm start             # Start Metro Bundler
npm start -- --web    # Web only
npm start -- --ios    # iOS Simulator
npm start -- --ios -- --clear  # Clear cache

# Cleaning
npm start -- --clear  # Clear Metro cache
rm -rf node_modules   # Nuclear option
npm install --legacy-peer-deps  # Reinstall

# Debugging
expo doctor           # Check setup
expo logs             # View app logs
```

## 🐛 Troubleshooting

### Port in Use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Start again
npm start -- --web
```

### Metro Bundler Stuck
```bash
# Clear cache and restart
npm start -- --clear
```

### Import Errors
```bash
# Reinstall deps
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm start -- --clear
```

### "Unable to resolve module"
- Check file path exists
- Verify index.ts exports
- Restart bundler with `--clear`

## 🎯 Testing Checklist

- [ ] Open http://localhost:8081
- [ ] See Login screen
- [ ] Navigate between tabs
- [ ] View components rendering correctly
- [ ] Edit code and see hot reload
- [ ] Check console for errors (browser Dev Tools)
- [ ] Test on iOS: `npm start -- --ios`
- [ ] Test on Android: `npm start -- --android`

## 📚 Documentation Files

- **COMPLETION_REPORT.md** - Full session summary
- **IMPLEMENTATION_GUIDE.md** - Remaining features & architecture
- **SETUP_INSTRUCTIONS.md** - Detailed setup guide
- **This file** - Quick reference

## 🔑 Environment Variables

Located in `.env`:
```bash
REACT_APP_API_URL=https://ummyou.com/api
GOOGLE_OAUTH_CLIENT_ID_iOS=...
GOOGLE_OAUTH_CLIENT_ID_Android=...
GOOGLE_OAUTH_WEB_CLIENT_ID=...
```

Never commit `.env` - it contains secrets!

## 📊 Project Statistics

- **Components:** 8
- **Screens:** 6
- **Files:** 50+
- **Lines of Code:** 3,500+
- **Design Tokens:** 50+
- **Progress:** 70% complete

## 🚢 Ready for Deployment

### To Build for iOS
```bash
eas build --platform ios
```

### To Build for Android
```bash
eas build --platform android
```

### To Build for Web
```bash
expo export --platform web
```

## 💡 Pro Tips

1. **Use Redux DevTools** - Inspect state in browser
2. **Hot Reload** - Edit files while app runs
3. **Component Reusability** - Max 200 lines per component
4. **Theme Tokens** - Use `colors`, `spacing`, `typography`
5. **TypeScript** - Files ending in `.tsx` or `.ts`
6. **Testing** - Each component has `.test.tsx`

## 🤝 Code Style

- **Naming:** CamelCase for components, snake_case for files
- **Exports:** Use named exports in components
- **Props:** Define interfaces for all props
- **Styles:** Always use StyleSheet.create()
- **Colors:** Always from theme, never hardcoded

## 📞 Need Help?

1. Check IMPLEMENTATION_GUIDE.md for architecture
2. Look at existing components for patterns
3. Review src/theme/theme.ts for available tokens
4. Check Redux store setup in src/store/

---

**Last Updated:** Feb 13, 2025
**App Status:** ✅ Running at http://localhost:8081
