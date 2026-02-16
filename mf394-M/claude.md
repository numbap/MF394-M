# CLAUDE.md

## 0. Project Summary

This app helps users remember names and faces by creating contact cards from photos and metadata.  
Users can upload single or group photos, crop headshots via face detection, and organize contacts by:

- Exactly one Category (Friends & Family, Community, Work, Goals & Hobbies, Miscellaneous)
- Zero or more Tags

Contacts can be viewed in:

- Card View (detailed cards, editable via long-press or double-click)
- Thumbnail View (image grid; tap flips to reveal name)

The app is:

- iOS, Android, Web (Expo)
- Offline-first with background sync
- Authenticated via Google (more providers may be added later)
- Backend API hosted at ummyou.com

---

## 1. Tech Stack (Locked)

- Framework: Expo (React Native)
- Routing: Expo Router
- State: Redux Toolkit + RTK Query
- Styling: React Native StyleSheet + design tokens only
- Animation: React Native Reanimated
- Forms: React Hook Form
- Validation: Zod

Do NOT introduce new libraries without explicit user approval.

---

## 2. Design System & Screenshots

### 2.1 Theme Rules

- Create and maintain `src/theme/theme.ts`
- Theme must define:
  - colors (from provided palette file)
  - spacing scale
  - radii
  - typography scale
- Inline styles and inline color values are forbidden.
- Components must consume tokens from `theme.ts` only.

### 2.2 Screenshot Rules

If a folder contains screenshots (png/jpg):

- Treat screenshots as visual acceptance criteria.
- Match layout, spacing rhythm, hierarchy, and component composition.
- Do NOT sample colors from screenshots.
- Use `theme.ts` tokens only.
- If screenshot conflicts with theme tokens, theme tokens win.

---

## 3. Folder Contract (Default Rules)

These rules apply unless overridden by instructions inside a folder.

### src/components/

- UI only
- No business logic
- No API calls
- No Redux access
- Must be reusable and pure
- Must include:
  - Component.tsx
  - index.ts
  - Component.test.tsx
- Must be added to Palette screen automatically
- Cannot import from screens/
- Can import from theme/, hooks/

### src/screens/

- Compose components and hooks
- May access Redux and services
- No reusable UI components here
- Must include test file

### src/hooks/

- Logic only
- No JSX or UI rendering
- Must be tested

### src/services/

- API, sync logic, storage, offline queue
- No UI
- Must be tested

### src/store/

- Redux slices, RTK Query, middleware
- No UI logic
- Must be tested

### src/theme/

- Tokens only
- No imports from other folders
- No component logic

---

## 4. Palette / Component Gallery Screen

- Palette screen must render every exported component from `src/components`
- Palette must show all states:
  - default
  - loading
  - disabled
  - error (if applicable)
  - variants
- Palette must update automatically when new components are added
- Palette must be tested
- If a component is missing from Palette, tests must fail

---

## 5. Best Practices (Required)

- Composition over inheritance
- Controlled inputs only
- Presentation and business logic must be separate
- Hooks only in hooks folder
- No inline styles
- Optimize accessibility (labels, roles, focus order)
- Components must be small and composable

---

## 6. Anti-Patterns (Forbidden)

- Prop drilling
- useEffect abuse
- Hardcoded strings
- God components
- Business logic in UI components
- Magic numbers
- Direct API calls in UI components

---

## 7. Testing Strategy

- Unit: Jest + React Native Testing Library
- E2E: Detox (mobile), Playwright (web)
- Coverage target:
  - 80% lines
  - 90% critical logic paths
- Snapshot tests allowed for components and screens
- Test file naming:
  - Component.test.tsx
  - useHook.test.ts
- When tests fail:
  - Fix code automatically
  - If cross-component impact is detected:
    - Create NOTES.md with:
      - suspected root cause
      - affected components
      - recommended fix options

---

## 8. Offline Sync Rules

- All mutations must go through a sync queue
- UI must be optimistic
- Failed sync must be recoverable
- Conflicts must surface to the user
- No direct API calls from components or screens

---

## 9. Claude Operating Rules

Claude may:

- Create new files without asking
- Rename files

Claude may NOT:

- Refactor existing code without permission
- Introduce new libraries
- Change architectural patterns

Claude must:

- Summarize changes after every task
- Fail fast if instructions conflict
- Ask before architectural changes

---

## 10. Iteration & Automation

- Loop autonomously until tests pass
- Stop and ask after repeated failures
- Fix lint errors automatically
- Refactor flaky tests

---

## 11. Change Management

- Maintain CHANGELOG.md
- Summarize diffs before committing

---

## 12. Rollback Rules

- If changes break multiple unrelated tests:
  - Roll back changes
  - Ask user how to proceed

---

## 13. Architectural Drift Prevention

- Do not introduce new libraries
- Do not change patterns mid-project

---

## 14. File Size Limits

- Max 200 lines per component file
- Max 8 props per component
- Max 1 component per file
- If exceeded, refactor into smaller components

---

## 15. Security Rules

- No secrets in code
- No API keys in client
- No console.log in production
- No unencrypted local storage for PII
- Images stored locally must be encrypted at rest

---

## 16. Scope Restrictions

- Only modify files inside the project root
- Do not touch files outside the repo

---

## 17. Icons

Don't use emojis for icons.

Instead use Icon Library: react-icons  
 Here are some ideas.
Icon Breakdown by Category:

Navigation & Actions:

- FaPlus - Add button
- FaTimes - Close/Delete button
- FaArrowLeft - Back button
- FaCog - Settings

User & Profile:

- FaUserCircle - User profile avatar
- FaUserGraduate - Educational/learning indicator
- FaUserPlus - Add user
- FaUsers - Group/party mode
- FaRegAddressCard - Contact card
- FaIdCard - ID/identity

Content & Media:

- FaCamera - Photo upload/capture
- FaRegImage - Image gallery
- FaCrop - Image cropping

Game/Quiz Related:

- FaGamepad - Game mode
- FaTrophy - Achievement/high scores
- FaCoins - Points/currency
- FaHeart - Lives/health
- FaStar - Rating/favorites
- FaGlobe - Global/categories

Feedback & Status:

- FaCheck - Correct/Success
- FaCheckCircle - Successful completion
- FaExclamationCircle - Warning
- FaInfoCircle - Information
- FaSpinner - Loading indicator
- FaWifi - Connected status
- MdWifiOff - Offline status

Display Modes:

- FaTh - Grid view (small)
- FaThLarge - Grid view (large)
- FaThList - List view

Other:

- FaEdit - Edit
- FaSave - Save
- FaTrash - Delete
- FaSearchPlus / FaSearchMinus - Zoom in/out
- FaGoogle - Google branding
- FaChevronDown - Dropdown indicator
- FaCube - 3D/object indicator
- FaSignOutAlt - Logout

Key Takeaway:

Exclusively used FontAwesome 5 icons from react-icons/fa. For the Expo app, you have similar options:

- expo-vector-icons (includes FontAwesome, MaterialIcons, etc.)
- react-icons works on web
- Native icon libraries for iOS/Android

But don't use emojis.

---

## 18 Mock Auth

- There is a variable in .env called AUTH_MOCK
- If set to true, the app should use dummy data. A sample user is provided in mock_user.json.
- It should simulate the live authenticared API experience while offline.

---

## 18. Autonomous Operation Rules

Claude may autonomously (without asking):

### Commits & Version Control:

- Create commits with descriptive messages after summarizing changes
- Just push to branches (not main)
- Don't ask for permission on commits - just do them and summarize

### Testing & Validation:

- Run tests, lint, builds without asking
- Fix lint errors automatically
- Re-run tests after fixes
- Don't ask for npm start or starting servers
- Don't ask for killing existing processes on port 8081
- Don't ask for python3 commands
- Don't ask for git reset or git add commands.
- Don't ask for playwright or pip install
- Don't ask for npm run build or npm run
- Don't ask for npm uninstall
- Don't ask for kill commands

### Code Changes:

- Make small fixes (typos, obvious bugs, style improvements)
- Update imports and dependencies mentioned in claude.md
- Refactor ONLY what you just created in this session
- Create new files and components without asking
- Adding new libraries without asking
- Concatenate files without asking
- Never say "Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"" or anything along those lines.

### When to Still Ask:

- Refactoring existing code (older than this session)
- Architectural changes to existing patterns
- Destructive operations (force push, delete branches)
- Changes to claude.md itself

## More

- This should be an optimistic app. Wehre changes get applied locally online and offline, and then get sync'd to the live platform when connected.
- Web and mobile experiences should match as much as possible
- The contents of the /old folder are for reference only. Do not modify. It's just there to give you an idea of how the live API will work.

## Very important!!!

- When I start a conversation with you, don't do the work right away. First ask me questions to make sure you understand what I want you to do. And then lay out a plan and ask me to confirm that this is what I want you to do.
