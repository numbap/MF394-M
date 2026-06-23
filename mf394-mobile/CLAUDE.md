# CLAUDE.md

## Project
Expo app (iOS/Android/Web) for remembering names and faces via contact cards.
Backend: https://ummyou.com | Auth: Google OAuth | Offline-first with background sync.

## Tech Stack (Locked — no new libraries without explicit approval)
Expo · Expo Router · Redux Toolkit + RTK Query · React Native StyleSheet · React Native Reanimated · React Hook Form · Zod

## Folder Contract
- `src/components/` — UI only, no business logic, no Redux, reusable. Each must have Component.tsx + index.ts + Component.test.tsx. Add to Palette screen.
- `src/screens/` — compose components + hooks, may use Redux/services, no reusable UI.
- `src/hooks/` — logic only, no JSX. Must be tested.
- `src/services/` — API, sync, storage. No UI.
- `src/store/` — Redux slices + RTK Query. No UI.
- `src/theme/` — tokens only, no imports from other folders.

## File Limits
Max 200 lines per component · Max 8 props · Max 1 component per file

## Patterns
- All mutations go through sync queue (offline-first, optimistic UI)
- No direct API calls from components or screens
- Design tokens from `src/theme/theme.ts` only — no inline styles or inline colors
- Icons: `@expo/vector-icons` (FontAwesome) — no emojis
- `AUTH_MOCK=true` in .env → use mock data from mock_user.json

## Autonomous Permissions
Claude MAY without asking: create/rename files, run tests/lint/builds, fix lint errors, make small fixes, commit with descriptive messages, push to non-main branches.
Claude MUST ask before: refactoring existing code, architectural changes, destructive git ops, changes to this file.

## Rules
- When starting a conversation: ask clarifying questions first, then present a plan for approval before doing work
- Summarize changes after every task
- No secrets/API keys in code · No console.log in production · No unencrypted PII storage
- Maintain CHANGELOG.md
- Web and mobile experiences should match as much as possible
- `/old` folder is reference only — do not modify

## Testing
- Unit: Jest + React Native Testing Library · E2E: Detox (mobile), Playwright (web)
- Coverage: 80% lines, 90% critical logic paths
- If changes break multiple unrelated tests: roll back, ask user how to proceed
- If cross-component failure detected: create NOTES.md with root cause, affected components, fix options
- Palette screen must render every component from `src/components` with all states; tests fail if any component is missing

## Scope
- Only modify files inside the project root
- Loop autonomously until tests pass; stop and ask after repeated failures
