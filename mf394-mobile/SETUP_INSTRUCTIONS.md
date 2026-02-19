# Setup & Running the App

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode installed on macOS
- For Android: Android Studio or emulator

## Installation

```bash
cd mf394-mobile
npm install --legacy-peer-deps
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your Google OAuth credentials:

```bash
REACT_APP_API_URL=https://ummyou.com/api
GOOGLE_OAUTH_CLIENT_ID_iOS=YOUR_IOS_CLIENT_ID
GOOGLE_OAUTH_CLIENT_ID_Android=YOUR_ANDROID_CLIENT_ID
GOOGLE_OAUTH_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID
```

## Running the App

### Web (Fastest for development)
```bash
npm start -- --web
# or
expo start --web
```

Open browser to `http://localhost:19006` or `http://localhost:8081`

### iOS Simulator (macOS only)
```bash
npm start -- --ios
# or
expo start --ios
```

### Android Emulator
```bash
npm start -- --android
# or
expo start --android
```

### Development Mode
```bash
npm start
# Press 'w' for web
# Press 'i' for iOS
# Press 'a' for Android
# Press 'e' to clear cache
# Press 'r' to reload
```

## Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache and restart
npm start -- --clear
```

### Dependencies Missing
```bash
# Reinstall all deps
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Port Already in Use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9
# or on port 19006
lsof -ti:19006 | xargs kill -9
```

## Code Quality

```bash
# Lint and fix code
npm run lint

# Format code
npx prettier --write src/

# Type check (once tsconfig.json is added)
npx tsc --noEmit

# Run tests
npm test
```

## Building for Production

### Web
```bash
# Build standalone web
expo export --platform web
```

### iOS
```bash
# Setup EAS (one time)
eas init

# Build on EAS servers
eas build --platform ios

# Or build locally
eas build --platform ios --local
```

### Android
```bash
eas build --platform android
```

## Project Structure

```
mf394-mobile/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen containers
│   ├── hooks/           # Logic hooks
│   ├── services/        # API, storage, logic
│   ├── store/           # Redux + RTK Query
│   ├── theme/           # Design tokens
│   ├── utils/           # Helpers
│   └── App.js           # Root component
├── assets/              # Images, fonts, sounds
├── app.json             # Expo config
├── package.json         # Dependencies
└── .env                 # Environment variables
```

## Important Files

- **app.json** - Expo configuration (bundle IDs, schemes, plugins)
- **.env** - Environment variables (NEVER commit!)
- **src/App.js** - Redux provider setup
- **src/theme/theme.ts** - Design tokens
- **src/store/** - Redux store configuration

## Next Steps

1. Set up Google OAuth credentials
2. Update `.env` with API URLs and credentials
3. Run `npm install --legacy-peer-deps`
4. Start with `npm start -- --web`
5. Test authentication flow first
6. Test contact creation
7. Add more features from IMPLEMENTATION_GUIDE.md

## Common Commands

```bash
# View app logs
expo logs

# Clear cache
expo start --clear

# Open specific platform
expo start --web --clear
expo start --ios
expo start --android

# Build standalone app
eas build

# Check diagnostics
expo doctor
expo prebuild --clean
```

## Performance Tips

- Use React DevTools: `react-native-debugger`
- Check bundle size: `expo export --platform web`
- Monitor app startup time
- Profile with React Profiler

## Support

- [Expo Docs](https://docs.expo.dev)
- [Expo Community](https://expo.dev/community)
- [React Native Docs](https://reactnative.dev)

---

**Last Updated:** Feb 13, 2025
