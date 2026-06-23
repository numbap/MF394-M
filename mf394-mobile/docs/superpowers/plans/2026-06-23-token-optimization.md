# Token Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce Claude Code token consumption per session by condensing CLAUDE.md, creating a memory system, splitting large files, and consolidating duplicate theme files.

**Architecture:** Four independent workstreams — each can be done in isolation. Complete Tasks 1-2 first (they have no code risk), then Tasks 3-7 (file splits + theme), then Task 8 (validation).

**Tech Stack:** Expo (React Native), TypeScript, Redux Toolkit, React Native StyleSheet

---

## File Map

**Created:**
- `/Users/patjo/Dev/MF394-M/mf394-mobile/CLAUDE.md` — condensed project rules (~80 lines)
- `/Users/patjo/.claude/projects/-Users-patjo-Dev-MF394-M-mf394-mobile/memory/project_overview.md`
- `/Users/patjo/.claude/projects/-Users-patjo-Dev-MF394-M-mf394-mobile/memory/folder_structure.md`
- `/Users/patjo/.claude/projects/-Users-patjo-Dev-MF394-M-mf394-mobile/memory/known_issues.md`
- `src/components/Cropper/CropperSlider.tsx` — extracted slider component
- `src/components/Cropper/WebCropper.tsx` — extracted web implementation
- `src/components/Cropper/MobileCropper.tsx` — extracted mobile implementation
- `src/screens/AddEdit/ContactFormSteps.tsx` — form steps UI
- `src/screens/AddEdit/ContactPhotoStep.tsx` — photo handling UI
- `src/screens/Listing/ContactList.tsx` — list rendering
- `src/screens/Party/PartyModeCard.tsx` — game card UI
- `src/components/TagManagementView/TagList.tsx` — tag list rendering

**Modified:**
- `/Users/patjo/Dev/MF394-M/CLAUDE.md` → replaced by project-level file
- `src/components/Cropper/Cropper.tsx` — thin platform router (~30 lines)
- `src/screens/AddEdit/AddEditContactScreen.tsx` — thin orchestrator
- `src/screens/Listing/ListingScreen.tsx` — thin orchestrator
- `src/screens/Party/PartyModeScreen.tsx` — thin orchestrator
- `src/components/TagManagementView/TagManagementView.tsx` — thin orchestrator
- `src/theme/theme.ts` — add zIndex + components tokens from Themes.ts
- `src/utils/constants.js` — remove deprecated COLORS/SPACING/BORDER_RADIUS exports
- `src/screens/Games/PracticeGameScreen.js` — migrate to theme.ts tokens
- `src/components/TagFilter.js` — migrate to theme.ts tokens

**Deleted:**
- `/Users/patjo/Dev/CLAUDE.md` — root-level duplicate
- `src/theme/Themes.ts` — no imports anywhere, superseded by theme.ts
- `src/styles/theme.js` — no imports anywhere, wraps deprecated constants

---

## Task 1: Condense CLAUDE.md

**Files:**
- Delete: `/Users/patjo/Dev/CLAUDE.md`
- Create: `/Users/patjo/Dev/MF394-M/mf394-mobile/CLAUDE.md`
- Delete: `/Users/patjo/Dev/MF394-M/CLAUDE.md` (after new file is in place)

- [ ] **Step 1: Create condensed CLAUDE.md in the project root**

```markdown
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
Claude MAY without asking: create/rename files, run tests/lint/builds, fix lint errors, make small fixes, add libraries, commit with descriptive messages, push to non-main branches.
Claude MUST ask before: refactoring existing code, architectural changes, destructive git ops, changes to this file.

## Rules
- Summarize changes after every task
- No secrets/API keys in code · No console.log in production · No unencrypted PII storage
- Maintain CHANGELOG.md
- Web and mobile experiences should match as much as possible
- `/old` folder is reference only — do not modify
- When starting a conversation: ask clarifying questions first, then present a plan for approval before doing work
```

- [ ] **Step 2: Verify the new file is at the project root**

```bash
cat /Users/patjo/Dev/MF394-M/mf394-mobile/CLAUDE.md | wc -l
```
Expected: ~55 lines

- [ ] **Step 3: Delete the root-level duplicate**

```bash
rm /Users/patjo/Dev/CLAUDE.md
```

- [ ] **Step 4: Delete the parent-level duplicate**

```bash
rm /Users/patjo/Dev/MF394-M/CLAUDE.md
```

- [ ] **Step 5: Commit**

```bash
cd /Users/patjo/Dev/MF394-M/mf394-mobile
git add CLAUDE.md
git add -u /Users/patjo/Dev/CLAUDE.md /Users/patjo/Dev/MF394-M/CLAUDE.md
git commit -m "chore: condense CLAUDE.md to single project-level file (~55 lines)"
```

---

## Task 2: Create Memory System

**Files:**
- Create: `/Users/patjo/.claude/projects/-Users-patjo-Dev-MF394-M-mf394-mobile/memory/project_overview.md`
- Create: `/Users/patjo/.claude/projects/-Users-patjo-Dev-MF394-M-mf394-mobile/memory/folder_structure.md`
- Create: `/Users/patjo/.claude/projects/-Users-patjo-Dev-MF394-M-mf394-mobile/memory/known_issues.md`
- Create: `/Users/patjo/.claude/projects/-Users-patjo-Dev-MF394-M-mf394-mobile/memory/MEMORY.md`

- [ ] **Step 1: Create project_overview.md**

```markdown
---
name: Project Overview
description: What the app does, tech stack, API, auth pattern
type: project
---

UmmYou is an Expo app (iOS/Android/Web) that helps users remember names and faces. Users create contact cards from photos, organize by one Category (Friends & Family, Community, Work, Goals & Hobbies, Miscellaneous) and zero or more Tags. Contacts display in Card View or Thumbnail View (tap to flip name).

**Tech stack:** Expo · Expo Router · Redux Toolkit + RTK Query · React Native StyleSheet · React Native Reanimated · React Hook Form · Zod

**API:** https://ummyou.com (production) | https://memcard-git-mobileapi-numbaps-projects.vercel.app/ (staging, currently in .env)

**Auth:** Google OAuth via expo-auth-session on web, @react-native-google-signin/google-signin on native. `AUTH_MOCK=true` in .env bypasses auth with mock_user.json data.

**Offline-first:** All mutations go through a sync queue. UI is optimistic. Conflicts surface to the user.

**Why:** How it shapes suggestions: respect the locked tech stack, always route mutations through the sync queue, keep web/mobile parity.
```

- [ ] **Step 2: Create folder_structure.md**

```markdown
---
name: Folder Structure
description: Folder contract summary and key file locations
type: project
---

**Folder roles:**
- `src/components/` — pure UI components, no Redux, each has Component.tsx + index.ts + Component.test.tsx
- `src/screens/` — screen-level composition, may use Redux and services
- `src/hooks/` — business logic hooks, no JSX
- `src/services/` — API calls, sync queue, session cache, token storage
- `src/store/` — Redux slices (auth, contacts, tags, filters, ui, shareIntent) + RTK Query APIs (contacts, auth, tags, upload, extract)
- `src/theme/` — single source of truth: `theme.ts` (colors, spacing, radii, typography, shadows, layout)
- `src/utils/` — constants.js (API config, endpoints), secureStore, imageCropping, contactDataTransform
- `src/navigation/` — RootNavigator.js (bottom tabs + auth routing)
- `src/constants/` — categories, etc.

**Key files:**
- Theme tokens: `src/theme/theme.ts`
- Redux store entry: `src/store/index.ts`
- API base URL + endpoints: `src/utils/constants.js`
- Navigation: `src/navigation/RootNavigator.js`
- App entry: `src/App.js` → `index.js`
- Palette/component gallery: look for PaletteScreen in src/screens/

**How to apply:** Read these files first when orienting on a task. No need to explore folder structure from scratch.
```

- [ ] **Step 3: Create known_issues.md**

```markdown
---
name: Known Issues
description: Current bugs and in-progress work
type: project
---

- Google OAuth redirect URI (`http://localhost:8081/api/auth/callback/google`) needs to be registered in Google Cloud Console for local web dev.
- `shadow*` style props are deprecated on web — should migrate to `boxShadow`.
- `props.pointerEvents` is deprecated — should migrate to `style.pointerEvents`.
- `src/components/TagFilter.js` and `src/screens/Games/PracticeGameScreen.js` still use deprecated COLORS/SPACING constants instead of theme.ts tokens.

**How to apply:** Check this file when asked about current issues or before touching auth/theme code.
```

- [ ] **Step 4: Create MEMORY.md index**

```markdown
- [Project Overview](project_overview.md) — app purpose, tech stack, API domain, auth pattern, offline-first rules
- [Folder Structure](folder_structure.md) — folder contracts, key file locations, store/theme/nav entry points
- [Known Issues](known_issues.md) — current bugs, deprecated patterns, in-progress items
```

- [ ] **Step 5: Verify files exist**

```bash
ls /Users/patjo/.claude/projects/-Users-patjo-Dev-MF394-M-mf394-mobile/memory/
```
Expected: `MEMORY.md  folder_structure.md  known_issues.md  project_overview.md`

---

## Task 3: Split Cropper.tsx

**Files:**
- Create: `src/components/Cropper/CropperSlider.tsx` — shared slider (~80 lines)
- Create: `src/components/Cropper/WebCropper.tsx` — web implementation (~180 lines)
- Create: `src/components/Cropper/MobileCropper.tsx` — mobile implementation (~280 lines)
- Modify: `src/components/Cropper/Cropper.tsx` — platform router + shared styles (~80 lines)
- Modify: `src/components/Cropper/index.ts` — re-export Cropper

- [ ] **Step 1: Create CropperSlider.tsx**

Extract lines 41-109 from Cropper.tsx into a new file:

```tsx
import React, { useRef } from "react";
import { View, PanResponder, GestureResponderEvent, StyleSheet } from "react-native";
import { colors, spacing, radii, shadows } from "../../theme/theme";

interface CropperSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
  containerWidth: number;
}

export function CropperSlider({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step,
  containerWidth,
}: CropperSliderProps) {
  const sliderWidth = containerWidth - spacing.md * 2;
  const sliderRef = useRef<View>(null);
  const sliderXRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (sliderRef.current) {
          sliderRef.current.measure((_x, _y, _width, _height, pageX) => {
            sliderXRef.current = pageX;
            updateValueFromTouch(evt.nativeEvent.pageX, pageX);
          });
        }
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        updateValueFromTouch(evt.nativeEvent.pageX, sliderXRef.current);
      },
    })
  ).current;

  const updateValueFromTouch = (touchX: number, trackX: number) => {
    const position = touchX - trackX;
    const clampedPosition = Math.max(0, Math.min(sliderWidth, position));
    const percentage = clampedPosition / sliderWidth;
    const totalRange = maximumValue - minimumValue;
    const rawValue = minimumValue + percentage * totalRange;
    const snappedValue = Math.round(rawValue / step) * step;
    onValueChange(Math.max(minimumValue, Math.min(maximumValue, snappedValue)));
  };

  const progress = (value - minimumValue) / (maximumValue - minimumValue);
  const thumbPosition = progress * sliderWidth;

  return (
    <View style={styles.sliderWrapper} {...panResponder.panHandlers}>
      <View ref={sliderRef} style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: thumbPosition }]} />
        <View style={[styles.sliderThumb, { left: thumbPosition }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: colors.semantic.border,
    borderRadius: radii.full,
    justifyContent: "center",
    position: "relative",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: colors.primary[500],
    borderRadius: radii.full,
  },
  sliderThumb: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.primary[500],
    marginLeft: -14,
    top: -10,
    ...shadows.md,
  },
});
```

- [ ] **Step 2: Create WebCropper.tsx**

Extract lines 112-286 from Cropper.tsx into a new file (replace internal `SliderComponent` with `CropperSlider`):

```tsx
import React, { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { FormButtons } from "../FormButtons";
import { CropperSlider } from "./CropperSlider";
import { colors, spacing, radii, typography } from "../../theme/theme";
import type { CropperProps } from "./Cropper";

export function WebCropper({ imageUri, onCropConfirm, onCancel }: CropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();

  const UI_CHROME_HEIGHT =
    spacing.lg +
    typography.headline.large.lineHeight +
    spacing.lg +
    spacing.lg +
    76 +
    148;

  const availableWidth = viewportWidth - spacing.lg * 2;
  const availableHeight = viewportHeight - UI_CHROME_HEIGHT;
  const calculatedSize = Math.min(availableWidth, availableHeight);
  const CANVAS_SIZE = Math.max(300, calculatedSize);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsLoading(true);
    try {
      const croppedImage = await cropImageUsingCanvas(imageUri, croppedAreaPixels);
      onCropConfirm(croppedImage);
    } catch (error) {
      console.error("Crop failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cropImageUsingCanvas = (uri: string, cropPixels: any): Promise<string> =>
    new Promise((resolve, reject) => {
      try {
        if (uri.startsWith("file://")) {
          fetch(uri)
            .then((r) => r.blob())
            .then((blob) => performCanvasCrop(URL.createObjectURL(blob), cropPixels, resolve, reject))
            .catch(reject);
        } else {
          performCanvasCrop(uri, cropPixels, resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });

  const performCanvasCrop = (
    uri: string,
    cropPixels: any,
    resolve: (v: string) => void,
    reject: (r?: any) => void
  ) => {
    const img = new (window as any).Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = Math.round(Math.min(cropPixels.width, cropPixels.height));
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");
        ctx.drawImage(img, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${uri}`));
    img.src = uri;
  };

  const EasyCrop = require("react-easy-crop").default;

  return (
    <View style={{ width: viewportWidth, alignItems: "center", backgroundColor: colors.semantic.background, padding: spacing.lg }}>
      <div
        style={{
          width: CANVAS_SIZE, height: CANVAS_SIZE,
          backgroundColor: colors.neutral.iron[900],
          borderRadius: radii.lg, overflow: "hidden",
          marginBottom: spacing.lg, position: "relative", touchAction: "none",
        }}
      >
        <EasyCrop
          image={imageUri} crop={crop} zoom={zoom} aspect={1}
          cropSize={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          onCropChange={setCrop}
          onCropComplete={(_: any, pixels: any) => setCroppedAreaPixels(pixels)}
          onZoomChange={setZoom}
          style={{ containerStyle: { width: "100%", height: "100%", backgroundColor: "#000" } }}
        />
      </div>
      <View style={{ width: CANVAS_SIZE + spacing.lg * 2, marginBottom: spacing.lg, paddingHorizontal: spacing.md }}>
        <CropperSlider
          value={zoom} onValueChange={setZoom}
          minimumValue={0.25} maximumValue={5} step={0.05}
          containerWidth={CANVAS_SIZE + spacing.lg * 2}
        />
      </View>
      <FormButtons
        primaryButton={{ label: "Crop", icon: "crop", onPress: handleConfirm, isLoading }}
        cancelButton={{ label: "Cancel", icon: "times", onPress: onCancel }}
      />
    </View>
  );
}
```

- [ ] **Step 3: Create MobileCropper.tsx**

Extract lines 289-560 from Cropper.tsx (replace internal `SliderComponent` with `CropperSlider`):

```tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View, Image, StyleSheet, ViewStyle, PanResponder,
  GestureResponderEvent, useWindowDimensions,
} from "react-native";
import { FormButtons } from "../FormButtons";
import { CropperSlider } from "./CropperSlider";
import { colors, spacing, radii, shadows } from "../../theme/theme";
import type { CropperProps } from "./Cropper";

export function MobileCropper({ imageUri, onCropConfirm, onCancel, style }: CropperProps) {
  const { width: deviceWidth } = useWindowDimensions();
  const canvasSize = deviceWidth - spacing.lg * 2;

  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const canvasSizeRef = useRef(canvasSize);
  canvasSizeRef.current = canvasSize;
  const initialDistance = useRef<number | null>(null);
  const initialZoom = useRef<number>(zoom);
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);
  const panStartX = useRef(0);
  const panStartY = useRef(0);
  const imageDimensionsRef = useRef({ width: 0, height: 0 });
  const zoomRef = useRef(1);
  const minZoomRef = useRef(0.1);

  useEffect(() => {
    let cancelled = false;
    const { manipulateAsync } = require("expo-image-manipulator");
    manipulateAsync(imageUri, []).then((probe: { width: number; height: number }) => {
      if (cancelled) return;
      const { width: w, height: h } = probe;
      setImageDimensions({ width: w, height: h });
      imageDimensionsRef.current = { width: w, height: h };
      const fitZoom = Math.min(canvasSizeRef.current / w, canvasSizeRef.current / h);
      setMinZoom(fitZoom);
      minZoomRef.current = fitZoom;
      setZoom(fitZoom);
      zoomRef.current = fitZoom;
    }).catch((err: any) => {
      if (!cancelled) console.warn("MobileCropper: failed to probe image size", err);
    });
    return () => { cancelled = true; };
  }, [imageUri]);

  const getDistance = (touches: any[]) => {
    const [t1, t2] = touches;
    return Math.sqrt(Math.pow(t1.pageX - t2.pageX, 2) + Math.pow(t1.pageY - t2.pageY, 2));
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        if (evt.nativeEvent.touches.length === 2) {
          initialDistance.current = getDistance(evt.nativeEvent.touches);
          initialZoom.current = zoomRef.current;
        } else {
          panStartX.current = offsetXRef.current;
          panStartY.current = offsetYRef.current;
        }
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: any) => {
        if (evt.nativeEvent.touches.length === 2) {
          const dist = getDistance(evt.nativeEvent.touches);
          if (initialDistance.current) {
            const clampedZoom = Math.max(minZoomRef.current, Math.min(3, initialZoom.current * (dist / initialDistance.current)));
            setZoom(clampedZoom);
            zoomRef.current = clampedZoom;
          }
        } else {
          const newX = panStartX.current + gestureState.dx;
          const newY = panStartY.current + gestureState.dy;
          const maxX = (imageDimensionsRef.current.width * zoomRef.current - canvasSizeRef.current) / 2;
          const maxY = (imageDimensionsRef.current.height * zoomRef.current - canvasSizeRef.current) / 2;
          const clampedX = maxX > 0 ? Math.max(-maxX, Math.min(maxX, newX)) : 0;
          const clampedY = maxY > 0 ? Math.max(-maxY, Math.min(maxY, newY)) : 0;
          setOffsetX(clampedX); offsetXRef.current = clampedX;
          setOffsetY(clampedY); offsetYRef.current = clampedY;
        }
      },
      onPanResponderRelease: () => { initialDistance.current = null; },
    })
  ).current;

  const handleImageLoad = () => {
    setOffsetX(0); offsetXRef.current = 0;
    setOffsetY(0); offsetYRef.current = 0;
  };

  const handleZoomChange = (value: number) => {
    setZoom(value); zoomRef.current = value;
    setOffsetX(0); offsetXRef.current = 0;
    setOffsetY(0); offsetYRef.current = 0;
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const { manipulateAsync, SaveFormat } = require("expo-image-manipulator");
      const { width: imgW, height: imgH } = imageDimensionsRef.current;
      const z = zoomRef.current;
      const ox = offsetXRef.current;
      const oy = offsetYRef.current;
      const cs = canvasSizeRef.current;
      const originX = Math.max(0, Math.min(Math.round((imgW * z / 2 - cs / 2 - ox) / z), imgW - 1));
      const originY = Math.max(0, Math.min(Math.round((imgH * z / 2 - cs / 2 - oy) / z), imgH - 1));
      const cropWidth = Math.min(Math.round(cs / z), imgW - originX);
      const cropHeight = Math.min(Math.round(cs / z), imgH - originY);
      const result = await manipulateAsync(
        imageUri,
        [
          { crop: { originX, originY, width: Math.max(1, cropWidth), height: Math.max(1, cropHeight) } },
          cropWidth > cropHeight ? { resize: { width: 800 } } : { resize: { height: 800 } },
        ],
        { compress: 0.85, format: SaveFormat.JPEG, base64: true }
      );
      if (!result.base64) throw new Error("Crop produced no image data");
      onCropConfirm(`data:image/jpeg;base64,${result.base64}`);
    } catch (error) {
      console.error("Cropping failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.canvasWrapper}>
        <View style={[styles.canvas, { width: canvasSize, height: canvasSize }]} {...panResponder.panHandlers}>
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, {
              width: imageDimensions.width * zoom,
              height: imageDimensions.height * zoom,
              left: (canvasSize - imageDimensions.width * zoom) / 2,
              top: (canvasSize - imageDimensions.height * zoom) / 2,
              transform: [{ translateX: offsetX }, { translateY: offsetY }],
            }]}
            resizeMode="contain"
            onLoad={handleImageLoad}
          />
          <View style={[styles.cropFrame, { width: canvasSize, height: canvasSize }]} />
        </View>
      </View>
      <View style={styles.sliderContainer}>
        <CropperSlider
          value={zoom} onValueChange={handleZoomChange}
          minimumValue={minZoom} maximumValue={3} step={0.05}
          containerWidth={canvasSize}
        />
      </View>
      <FormButtons
        primaryButton={{ label: "Crop", icon: "crop", onPress: handleConfirm, isLoading }}
        cancelButton={{ label: "Cancel", icon: "times", onPress: onCancel }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.semantic.background, padding: spacing.lg, width: "100%" },
  canvasWrapper: { alignItems: "center", marginBottom: spacing.lg },
  canvas: { backgroundColor: colors.neutral.iron[900], borderRadius: radii.lg, overflow: "hidden", position: "relative", ...shadows.md },
  image: { position: "absolute" },
  cropFrame: { position: "absolute", borderWidth: 2, borderColor: colors.primary[500], pointerEvents: "none" },
  sliderContainer: { width: "100%", marginBottom: spacing.lg, paddingHorizontal: spacing.md },
});
```

- [ ] **Step 4: Replace Cropper.tsx with thin platform router**

Replace the entire content of `src/components/Cropper/Cropper.tsx` with:

```tsx
import React from "react";
import { Platform, ViewStyle } from "react-native";
import { WebCropper } from "./WebCropper";
import { MobileCropper } from "./MobileCropper";

export interface CropperProps {
  imageUri: string;
  onCropConfirm: (croppedImageUri: string) => void;
  onCancel: () => void;
  style?: ViewStyle;
}

export function Cropper(props: CropperProps) {
  return Platform.OS === "web" ? <WebCropper {...props} /> : <MobileCropper {...props} />;
}
```

- [ ] **Step 5: Verify line counts**

```bash
wc -l src/components/Cropper/Cropper.tsx src/components/Cropper/CropperSlider.tsx src/components/Cropper/WebCropper.tsx src/components/Cropper/MobileCropper.tsx
```
Expected: each under 200 lines, total < 600

- [ ] **Step 6: Run the app to verify crop still works**

```bash
npx expo start --web --port 8081 --clear
```
Navigate to the crop screen and verify photo cropping works on web.

- [ ] **Step 7: Commit**

```bash
git add src/components/Cropper/
git commit -m "refactor: split Cropper.tsx into CropperSlider, WebCropper, MobileCropper"
```

---

## Task 4: Split AddEditContactScreen.tsx

**Files:**
- Read: `src/screens/AddEdit/AddEditContactScreen.tsx` (516 lines) first to identify split boundaries
- Create: `src/screens/AddEdit/ContactFormSteps.tsx` — multi-step form UI
- Create: `src/screens/AddEdit/ContactPhotoStep.tsx` — photo capture/upload UI
- Modify: `src/screens/AddEdit/AddEditContactScreen.tsx` — thin orchestrator

- [ ] **Step 1: Read the file to identify natural split points**

```bash
cat src/screens/AddEdit/AddEditContactScreen.tsx | head -60
```
Identify: which sections handle photo (camera/gallery), which handle form fields, which are the screen orchestrator.

- [ ] **Step 2: Extract ContactPhotoStep.tsx**

Create `src/screens/AddEdit/ContactPhotoStep.tsx` containing the photo capture/display/selection UI section (typically the top portion of the form with image picker, camera buttons, and photo preview). Export as `ContactPhotoStep`.

The component should accept props for: `photoUri`, `onPhotoSelect`, `onCameraOpen`, and any loading/error states.

- [ ] **Step 3: Extract ContactFormSteps.tsx**

Create `src/screens/AddEdit/ContactFormSteps.tsx` containing the form fields section (name, category, tags, notes inputs). Export as `ContactFormSteps`.

The component should accept props for: `control` (from react-hook-form), `errors`, `categories`, `tags`, and callbacks for tag/category changes.

- [ ] **Step 4: Update AddEditContactScreen.tsx to be a thin orchestrator**

Replace body with imports of `ContactPhotoStep` and `ContactFormSteps`, wiring their props from local state/hooks. Orchestrator keeps: Redux dispatch, form submission logic, navigation calls.

- [ ] **Step 5: Verify line counts**

```bash
wc -l src/screens/AddEdit/AddEditContactScreen.tsx src/screens/AddEdit/ContactFormSteps.tsx src/screens/AddEdit/ContactPhotoStep.tsx
```
Expected: each under 200 lines

- [ ] **Step 6: Run tests**

```bash
npm test -- --testPathPattern="AddEdit" --no-coverage
```
Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add src/screens/AddEdit/
git commit -m "refactor: split AddEditContactScreen into ContactPhotoStep + ContactFormSteps"
```

---

## Task 5: Split ListingScreen.tsx

**Files:**
- Read: `src/screens/Listing/ListingScreen.tsx` (439 lines) first
- Create: `src/screens/Listing/ContactList.tsx` — list/grid rendering
- Modify: `src/screens/Listing/ListingScreen.tsx` — thin orchestrator

- [ ] **Step 1: Read the file to identify split boundaries**

```bash
cat src/screens/Listing/ListingScreen.tsx | head -60
```
Identify: which section renders the FlatList/grid of contacts, which handles search/filter/sort state.

- [ ] **Step 2: Extract ContactList.tsx**

Create `src/screens/Listing/ContactList.tsx` containing the FlatList or ScrollView that renders contact cards/thumbnails. Export as `ContactList`.

Props should include: `contacts`, `viewMode` (card/thumbnail), `onContactPress`, `onContactLongPress`, `isLoading`, `onRefresh`.

- [ ] **Step 3: Update ListingScreen.tsx to be a thin orchestrator**

Replace list rendering section with `<ContactList />`. Keep in screen: Redux selectors for filtered contacts, search state, filter state, navigation handlers.

- [ ] **Step 4: Verify line counts**

```bash
wc -l src/screens/Listing/ListingScreen.tsx src/screens/Listing/ContactList.tsx
```
Expected: each under 200 lines

- [ ] **Step 5: Run tests**

```bash
npm test -- --testPathPattern="Listing|ListingScreen" --no-coverage
```
Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add src/screens/Listing/
git commit -m "refactor: extract ContactList from ListingScreen"
```

---

## Task 6: Split PartyModeScreen.tsx and TagManagementView.tsx

**Files:**
- Read: `src/screens/Party/PartyModeScreen.tsx` (379 lines) first
- Create: `src/screens/Party/PartyModeCard.tsx` — game card UI
- Modify: `src/screens/Party/PartyModeScreen.tsx` — thin orchestrator
- Read: `src/components/TagManagementView/TagManagementView.tsx` (368 lines) first
- Create: `src/components/TagManagementView/TagList.tsx` — tag list rendering
- Modify: `src/components/TagManagementView/TagManagementView.tsx` — thin orchestrator

- [ ] **Step 1: Read PartyModeScreen.tsx**

```bash
cat src/screens/Party/PartyModeScreen.tsx
```

- [ ] **Step 2: Extract PartyModeCard.tsx**

Create `src/screens/Party/PartyModeCard.tsx` containing the card that displays a contact's photo for guessing (photo, reveal animation, correct/wrong feedback). Export as `PartyModeCard`.

Props: `contact`, `isRevealed`, `onReveal`, `onCorrect`, `onWrong`.

- [ ] **Step 3: Update PartyModeScreen.tsx**

Replace card rendering with `<PartyModeCard />`. Keep in screen: game state (score, lives, current contact index), timer logic, Redux dispatches.

- [ ] **Step 4: Read TagManagementView.tsx**

```bash
cat src/components/TagManagementView/TagManagementView.tsx
```

- [ ] **Step 5: Extract TagList.tsx**

Create `src/components/TagManagementView/TagList.tsx` containing the scrollable list of tag items with edit/delete controls. Export as `TagList`.

Props: `tags`, `onEditTag`, `onDeleteTag`, `isLoading`.

- [ ] **Step 6: Update TagManagementView.tsx**

Replace list rendering with `<TagList />`. Keep in view: tag CRUD state, confirmation dialog logic, Redux calls.

- [ ] **Step 7: Verify line counts**

```bash
wc -l src/screens/Party/PartyModeScreen.tsx src/screens/Party/PartyModeCard.tsx src/components/TagManagementView/TagManagementView.tsx src/components/TagManagementView/TagList.tsx
```
Expected: each under 200 lines

- [ ] **Step 8: Run tests**

```bash
npm test -- --testPathPattern="Party|TagManagement" --no-coverage
```
Expected: all pass

- [ ] **Step 9: Commit**

```bash
git add src/screens/Party/ src/components/TagManagementView/
git commit -m "refactor: extract PartyModeCard and TagList from their parent components"
```

---

## Task 7: Consolidate Theme Files + Remove Deprecated Constants

**Files:**
- Modify: `src/theme/theme.ts` — add zIndex + components tokens from Themes.ts
- Delete: `src/theme/Themes.ts` — no imports anywhere, superseded
- Delete: `src/styles/theme.js` — no imports anywhere, wraps deprecated constants
- Modify: `src/utils/constants.js` — remove COLORS, SPACING, BORDER_RADIUS exports
- Modify: `src/screens/Games/PracticeGameScreen.js` — migrate to theme.ts tokens
- Modify: `src/components/TagFilter.js` — migrate to theme.ts tokens

- [ ] **Step 1: Add unique tokens from Themes.ts into theme.ts**

Append to `src/theme/theme.ts` before the final `export const theme = { ... }` line:

```ts
export const zIndex = {
  hidden: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};
```

Then add `zIndex` to the `theme` export object:
```ts
export const theme = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
  layout,
  zIndex,
};
```

- [ ] **Step 2: Delete Themes.ts**

```bash
rm src/theme/Themes.ts
```

- [ ] **Step 3: Delete src/styles/theme.js**

```bash
rm src/styles/theme.js
```

- [ ] **Step 4: Migrate PracticeGameScreen.js to theme.ts tokens**

In `src/screens/Games/PracticeGameScreen.js`:

Replace:
```js
import { COLORS, SPACING } from "../../utils/constants";
```
With:
```js
import { colors, spacing } from "../../theme/theme";
```

Then replace all usages:
- `COLORS.PRIMARY` → `colors.primary[500]`
- `COLORS.BACKGROUND` → `colors.semantic.background`
- `COLORS.SURFACE` → `colors.semantic.surface`
- `COLORS.TEXT` → `colors.semantic.text`
- `COLORS.BORDER` → `colors.semantic.border`
- `SPACING.SM` → `spacing.sm`
- `SPACING.MD` → `spacing.md`
- `SPACING.LG` → `spacing.lg`

- [ ] **Step 5: Migrate TagFilter.js to theme.ts tokens**

In `src/components/TagFilter.js`:

Replace:
```js
import { COLORS, SPACING } from "../utils/constants";
```
With:
```js
import { colors, spacing } from "../theme/theme";
```

Then replace all usages (same mapping as Step 4).

- [ ] **Step 6: Remove deprecated exports from constants.js**

In `src/utils/constants.js`, delete these blocks entirely:
```js
// Deprecated - use theme.ts instead
export const COLORS = { ... };

export const SPACING = { ... };

export const BORDER_RADIUS = { ... };
```

- [ ] **Step 7: Verify no remaining imports of deprecated constants**

```bash
grep -rn "COLORS\|BORDER_RADIUS" src/ --include="*.ts" --include="*.tsx" --include="*.js" | grep -v ".test." | grep -v "CONFETTI_COLORS"
```
Expected: no output (only `CONFETTI_COLORS` in QuizCelebration is OK — that's a local variable, not an import)

- [ ] **Step 8: Verify no imports of deleted files**

```bash
grep -rn "from.*Themes\|from.*styles/theme" src/ --include="*.ts" --include="*.tsx" --include="*.js"
```
Expected: no output

- [ ] **Step 9: Run the bundler to check for errors**

```bash
npx expo start --web --port 8081 --clear 2>&1 | grep -E "error|Error|failed|Failed" | head -20
```
Expected: no module resolution errors

- [ ] **Step 10: Run all tests**

```bash
npm test -- --no-coverage
```
Expected: all pass

- [ ] **Step 11: Commit**

```bash
git add src/theme/theme.ts src/utils/constants.js src/screens/Games/PracticeGameScreen.js src/components/TagFilter.js
git commit -m "chore: consolidate theme files, remove deprecated COLORS/SPACING/BORDER_RADIUS constants"
```

---

## Task 8: Validation

- [ ] **Step 1: Check all source files are under 200 lines**

```bash
find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" | grep -v test | grep -v node_modules | xargs wc -l | sort -rn | head -20
```
Expected: no file over 200 lines (excluding test files)

- [ ] **Step 2: Verify single CLAUDE.md**

```bash
find /Users/patjo/Dev -name "CLAUDE.md" 2>/dev/null
```
Expected: only `/Users/patjo/Dev/MF394-M/mf394-mobile/CLAUDE.md`

- [ ] **Step 3: Verify memory files exist**

```bash
ls /Users/patjo/.claude/projects/-Users-patjo-Dev-MF394-M-mf394-mobile/memory/
```
Expected: `MEMORY.md  folder_structure.md  known_issues.md  project_overview.md`

- [ ] **Step 4: Run full test suite**

```bash
npm test -- --no-coverage 2>&1 | tail -20
```
Expected: all test suites pass

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: token optimization complete — CLAUDE.md condensed, memory system, file splits, theme consolidated"
```
