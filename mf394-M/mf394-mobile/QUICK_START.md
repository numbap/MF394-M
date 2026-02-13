# Quick Start Guide

Get the Face Memorizer app running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Expo CLI: `npm install -g expo-cli`
- A text editor (VS Code recommended)

## Step 1: Install Dependencies (1 minute)

```bash
npm install
```

## Step 2: Configure Environment (2 minutes)

Edit `.env` file with your settings:

```env
GOOGLE_OAUTH_CLIENT_ID_iOS=YOUR_IOS_CLIENT_ID
GOOGLE_OAUTH_CLIENT_ID_Android=YOUR_ANDROID_CLIENT_ID
API_BASE_URL=http://localhost:3000  # or your API domain
```

> **For testing**: You can start with dummy values, authentication will fail but UI will still work.

## Step 3: Start Development Server (1 minute)

```bash
npm start
```

You'll see a QR code in the terminal.

## Step 4: Run on a Device/Simulator (1 minute)

### Option A: iOS Simulator
```bash
npm run ios
```

### Option B: Android Emulator
```bash
npm run android
```

### Option C: Expo Go App (Recommended for Quick Testing)
1. Download Expo Go from App Store or Google Play
2. Scan the QR code from terminal with your phone camera
3. App loads in Expo Go

## What to Expect

- 🔴 Red screen = missing dependencies or config error (check terminal)
- ✅ Login screen appears = app is working!

## Next Steps

1. **Test the UI**: Click around, check navigation
2. **Connect Backend**: Update API_BASE_URL in .env
3. **Set up Google OAuth**: Add real client IDs
4. **Run Tests**: `npm test`

## Common Issues

### "Cannot find module '@env'"
- Clear cache: `npm start -- --clear`
- Reinstall: `rm -rf node_modules && npm install`

### "Module not found: axios"
- Run: `npm install`

### Blank/White Screen
- Check console for errors: `npm start`
- Clear Expo cache: `expo-cli start --clear`

### Navigation Not Working
- Ensure all screen components exist in `src/screens/`
- Check navigation names match in RootNavigator.js

## File Structure Reference

```
src/
├── screens/        ← Your app pages
├── components/     ← Reusable UI components
├── services/       ← API calls (axios)
├── context/        ← Global state (AuthContext, ContactsContext)
├── hooks/          ← Custom React hooks
├── utils/          ← Helper functions
└── App.js          ← Root component
```

## Running Tests

```bash
npm test                # Run all tests once
npm run test:watch     # Watch mode (rerun on changes)
npm run test:coverage  # Generate coverage report
```

## Linting

```bash
npm run lint           # Check for code style issues
npm run lint -- --fix  # Auto-fix issues
```

## Mobile-Specific Features

The app includes:
- ✅ Navigation (stack + tabs)
- ✅ Authentication context
- ✅ Contact management context
- ✅ Image picker integration
- ✅ Face detection hook (mock)
- ✅ API client with token refresh

## Implementing Real Features

Currently, the app has:
- **Mock face detection** (always returns 2 faces)
- **No image upload** (screenshots only show placeholders)
- **No backend sync** (API calls will fail without backend)

To enable real features:

1. **Face Detection**: Install `@react-native-ml-kit/face-detection` and implement in `useFaceDetection` hook
2. **Image Upload**: The infrastructure is ready, just needs a working API backend
3. **Backend**: Set `API_BASE_URL` to your backend URL

## Debugging Tips

1. **Check console**: Look at terminal where you ran `npm start`
2. **React DevTools**: Install from Expo dashboard
3. **Network requests**: Use React Query DevTools for API debugging
4. **Component debugging**: Use `console.log()` in components

## Performance Tips

- Images are optimized to 500x500px
- Use the `shuffle` utility for randomizing lists
- Contacts are cached in React Context

## Next: Building for Production

See README.md for build instructions for iOS and Android.

---

**Stuck?** Check the full implementation guide in the parent directory: `REACT_NATIVE_IMPLEMENTATION_GUIDE.md`
