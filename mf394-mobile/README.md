# UmmYou - React Native App

A cross-platform React Native application for managing and memorizing faces of people you meet. Features include contact management, face detection, and interactive study games.

## Features

- 👤 **Contact Management**: Add, edit, and organize contacts with photos
- 🎯 **Face Detection**: Automatic face detection using ML Kit
- 🎮 **Study Games**: Quiz and practice games to memorize faces
- 🏷️ **Tag Organization**: Organize contacts by custom tags
- 📊 **Statistics**: Track your progress and learning
- 🔐 **Google Authentication**: Secure login with Google OAuth
- 📱 **Cross-Platform**: Works on iOS and Android

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: React Context API
- **Face Detection**: ML Kit (Google ML Kit)
- **Authentication**: Google Sign-In
- **Testing**: Jest + React Native Testing Library
- **HTTP Client**: Axios

## Project Structure

```
mf394-mobile/
├── src/
│   ├── screens/
│   │   ├── Auth/
│   │   ├── Home/
│   │   ├── Games/
│   │   ├── ImageHandling/
│   │   └── Stats/
│   ├── components/
│   ├── services/
│   ├── context/
│   ├── hooks/
│   ├── utils/
│   └── navigation/
├── __tests__/
├── assets/
└── babel.config.js
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator or Xcode (for iOS development)
- Android Studio or Android SDK (for Android development)

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your API endpoints and Google OAuth credentials:
   ```
   GOOGLE_OAUTH_CLIENT_ID_iOS=your-ios-client-id
   GOOGLE_OAUTH_CLIENT_ID_Android=your-android-client-id
   API_BASE_URL=https://your-api-domain.com
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

## Development

### Run on iOS
```bash
npm run ios
```

### Run on Android
```bash
npm run android
```

### Run Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Lint Code
```bash
npm run lint
```

## Google OAuth Setup

### iOS
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials for iOS
3. Get your iOS Bundle ID from `app.json` (e.g., `com.ummyou.ios`)
4. Add the Client ID to `.env`

### Android
1. In the same Google Cloud Console project
2. Create OAuth 2.0 credentials for Android
3. Get your SHA-1 fingerprint:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
4. Add to Google Cloud Console and get the Client ID

## Building for Production

### iOS Build
```bash
npm run build:ios
```

### Android Build
```bash
npm run build:android
```

For detailed deployment instructions, see the implementation guide.

## API Endpoints

The app communicates with a backend API. Required endpoints:

- `POST /auth/login` - Google OAuth login
- `POST /auth/refresh` - Refresh tokens
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create tag
- `DELETE /api/tags/:id` - Delete tag
- `POST /api/upload-image` - Upload image
- `GET /api/game-contacts` - Get contacts for games (with tag filter)
- `POST /api/quiz-score` - Record quiz score
- `GET /api/stats` - Get user statistics

## Testing

The project includes unit tests for services, components, and context. To run tests:

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Troubleshooting

### Face Detection Not Working
- Ensure image quality is good
- Check minimum confidence threshold in `.env`
- Try with a different image

### Google OAuth Issues
- Verify Client IDs match in Google Cloud Console
- Check redirect URIs are configured
- Ensure bundle ID/package name matches configuration

### Build Failures
- Clear cache: `npx expo prebuild --clean`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Update Expo: `expo --version`

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/my-feature`
4. Submit a pull request

## Next Steps

- Implement real face detection with ML Kit
- Add offline sync with AsyncStorage
- Implement statistics dashboard
- Add push notifications
- Add accessibility features

## License

MIT

## Support

For issues or questions, please refer to the REACT_NATIVE_IMPLEMENTATION_GUIDE.md in the parent directory.
