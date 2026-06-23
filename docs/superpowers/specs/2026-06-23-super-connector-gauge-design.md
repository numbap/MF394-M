# Super-Connector Gauge — Design Spec

## Context

The Help screen needs a motivational element at the top that encourages users to add 30 contacts to become a "Super-Connector." The gauge visualizes progress as a thick ring that fills and shifts color from red (0) to green (30), with dynamic motivational text and a celebration animation at completion.

## Design: Thick Ring with Aura Glow (Approach H)

A single-color thick circular ring that fills clockwise from 0 to 30. The ring color interpolates smoothly based on the contact count:

- **0 contacts** — Red (`#dc2626`)
- **~10 contacts** — Orange (`#f97316`)
- **~15 contacts** — Yellow (`#eab308`)
- **~25+ contacts** — Green (`#22c55e`)
- **30 contacts** — Bright green (`#4ade80`)

The ring has a soft aura glow (blur filter) matching the current color.

### Center content
- Large bold number showing contact count (e.g. **15**)
- Below: "of 30" in secondary text

### Motivational text (below the ring)
Dynamic text changes based on count:
- 0: "Add your first contact!"
- 1–9: "Keep going!"
- 10–19: "You're building momentum!"
- 20–29: "Almost there!"
- 30: "Super-Connector!"

### Animation
- **On mount:** Ring draws from 0 to current value with easing (Reanimated `withTiming`, ~800ms)
- **On count change:** Ring animates smoothly to new value
- **At 30:** Celebration effect — reuse the existing confetti particle system from `QuizCelebration` component, ring pulses green

## Component

**Location:** `src/components/SuperConnectorGauge/SuperConnectorGauge.tsx` + `index.ts` + `SuperConnectorGauge.test.tsx`

**Props:**
- `contactCount: number` — current number of contacts (0–30, clamped)
- `maxCount?: number` — defaults to 30

**Dependencies (new):**
- `react-native-svg` — for the circular ring (cross-platform: iOS, Android, Web)

**Dependencies (existing):**
- `react-native-reanimated` — for mount/change animation
- Design tokens from `src/theme/theme.ts`

### Color interpolation
Compute ring color by interpolating through the red→orange→yellow→green stops based on `contactCount / maxCount` ratio. Use Reanimated's `interpolateColor` for smooth animated transitions.

### SVG structure
- `<Circle>` — background track ring (light gray, `colors.neutral.iron[100]`)
- `<Circle>` — progress ring with `strokeDasharray` / `strokeDashoffset` animated via Reanimated
- Center text rendered as React Native `<Text>` elements positioned absolutely over the SVG (not SVG `<text>`, for proper font rendering on native)

## Integration

In `src/screens/Help/HelpScreen.tsx`:
- Import `SuperConnectorGauge`
- Get contact count from Redux: `useSelector((state) => state.contacts?.data?.length ?? 0)`
- Render at the top of the ScrollView, before the help sections

## Celebration at 30

Reuse the confetti particle system from `src/components/QuizCelebration/QuizCelebration.tsx`. When `contactCount >= 30`:
- Trigger confetti particles
- Ring pulses (scale animation 1.0 → 1.05 → 1.0)
- Motivational text shows "Super-Connector!"

## Critical files
- `src/components/SuperConnectorGauge/SuperConnectorGauge.tsx` (new)
- `src/components/SuperConnectorGauge/index.ts` (new)
- `src/components/SuperConnectorGauge/SuperConnectorGauge.test.tsx` (new)
- `src/screens/Help/HelpScreen.tsx` (modify — add gauge at top)
- `src/components/QuizCelebration/QuizCelebration.tsx` (reference — reuse confetti logic)
- `src/theme/theme.ts` (reference — use existing tokens)
- `src/store/slices/contacts.slice.ts` (reference — read contact count)

## Verification
1. Run `npx expo start --web` and verify the gauge renders on the Help screen
2. Test with 0, 15, and 30 contacts (use `AUTH_MOCK=true` with modified mock data)
3. Verify animation plays on mount
4. Verify color transitions smoothly across the red→green spectrum
5. Verify celebration triggers at 30
6. Run on iOS simulator and Android emulator to confirm cross-platform rendering
7. Run component tests: `npx jest SuperConnectorGauge`
