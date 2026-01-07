# AnoteQuest Mobile (Expo)

Minimal Expo skeleton to run a basic notes screen in Expo Go.

Quick start
1. Install Expo CLI if needed: `npm install -g expo-cli` (optional) or use `npx expo` commands.
2. From repo root: `cd mobile`
3. Install dependencies: `yarn` (or `npm install`)
4. Start Metro: `npx expo start`
5. Open in **Expo Go** (scan QR code) or run on emulator with `yarn android` / `yarn ios`.

Optional: set backend API URL for `src/api.js` when building with EAS or locally:
- Local dev: `REACT_APP_API_URL=https://your-backend npx expo start`
- For production builds, use EAS/EAS secrets or set env during build.

Notes
- This is a minimal proof-of-concept. The web UI uses many web-only libraries which are not included here.
- The `Notes` screen uses `@react-native-async-storage/async-storage` for persistence.
