# Token Optimization Design

**Date:** 2026-06-23  
**Goal:** Reduce Claude Code token consumption per session without sacrificing app performance or developer experience.

---

## Problem

Four sources of token waste identified:

1. **CLAUDE.md** — Two identical ~300-line files loaded every session. Heavy on redundant rules, light on signal.
2. **No memory system** — Claude re-explores project structure, theme tokens, and tech stack from scratch each session.
3. **Large files** — 5 files exceed 200 lines significantly (up to 634L). Claude reads entire files when it only needs a small section.
4. **Duplicate theme/constants** — Two overlapping theme files (719L combined) and deprecated constant blocks that duplicate theme tokens.

---

## Design

### 1. CLAUDE.md Consolidation

- Delete `/Users/patjo/Dev/CLAUDE.md` (root-level duplicate)
- Condense `/Users/patjo/Dev/MF394-M/mf394-mobile/CLAUDE.md` from ~300 lines to ~80 lines
- Keep only rules that are non-obvious or that change Claude's behavior:
  - Tech stack lock (locked libraries list)
  - Folder contracts (what lives where)
  - Autonomous operation permissions
  - Offline-first / optimistic UI pattern
  - Mock auth behavior (`AUTH_MOCK`)
  - Icon library (react-icons, no emojis)
  - File size limits (200L max, 8 props max)
- Remove: verbose anti-pattern lists, best-practices that restate conventions, duplicated spacing rules

### 2. Memory System

Create memory files at `/Users/patjo/.claude/projects/-Users-patjo-Dev-MF394-M-mf394-mobile/memory/`:

- `project_overview.md` — what the app does, tech stack, API domain, auth pattern
- `folder_structure.md` — folder contract summary, key file locations (theme, store, navigation, constants)
- `known_issues.md` — current in-progress work, known bugs

These load automatically in future sessions, eliminating orientation reads.

### 3. Large File Splits

Each file is split into focused sub-components under 200 lines. The original file becomes a thin orchestrator (~100L).

| Original | Lines | Split Into |
|----------|-------|------------|
| `Cropper.tsx` | 634 | `CropperCanvas.tsx` + `CropperControls.tsx` + `Cropper.tsx` |
| `AddEditContactScreen.tsx` | 516 | `ContactFormSteps.tsx` + `ContactPhotoStep.tsx` + `AddEditContactScreen.tsx` |
| `ListingScreen.tsx` | 439 | `ContactList.tsx` + `ListingScreen.tsx` |
| `PartyModeScreen.tsx` | 379 | `PartyModeCard.tsx` + `PartyModeScreen.tsx` |
| `TagManagementView.tsx` | 368 | `TagList.tsx` + `TagManagementView.tsx` |

**Rules for splits:**
- Orchestrator files import and compose sub-components only
- Sub-components are pure/presentational where possible
- No logic moves between files — only extraction into focused units
- Barrel exports (`index.ts`) updated to re-export all new files
- Existing tests remain valid; new test files added for new components

### 4. Theme Consolidation

- Read both `theme.ts` and `Themes.ts` to map unique vs. duplicated tokens
- Merge into a single `src/theme/theme.ts` under 300 lines
- Delete `src/theme/Themes.ts`
- Remove deprecated `COLORS`, `SPACING`, `BORDER_RADIUS` exports from `src/utils/constants.js`
- Update all imports that reference `Themes.ts` or the removed constant exports

---

## Success Criteria

- CLAUDE.md: single file, ≤80 lines
- Memory files: exist and are accurate
- No source file exceeds 200 lines (excluding tests)
- Single theme file, no deprecated constant duplicates
- All existing tests pass after changes
- App builds and runs without errors

---

## Out of Scope

- Indexing libraries (revisit if codebase exceeds ~30K lines)
- Test file optimization
- Dead code audit
