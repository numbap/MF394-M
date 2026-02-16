# Tag Modal Verification Guide

## Current Implementation Status: ✅ COMPLETE

All components exist and are wired correctly:

### Files Involved:
1. ✅ `src/components/TagManagementModal/TagManagementModal.tsx` (364 lines)
2. ✅ `src/components/TagSelector/TagSelector.tsx` (Edit button on line 51-54)
3. ✅ `src/components/CategoryTagSelector/CategoryTagSelector.tsx` (passes onEditTags)
4. ✅ `src/screens/AddEdit/AddEditContactScreen.tsx` (modal on line 518-521)
5. ✅ `src/screens/Party/PartyModeScreen.tsx` (modal on line 381-384)
6. ✅ `src/hooks/useConfirmTagDelete.ts` (delete confirmation)

### Flow Diagram:
```
User clicks "Edit" button (TagSelector line 51)
  ↓
onEditTags() callback triggered
  ↓
handleEditTags() in screen (AddEdit or Party)
  ↓
setTagModalVisible(true)
  ↓
TagManagementModal renders with visible={true}
  ↓
Modal slides up from bottom
```

---

## How to Test

### Option 1: Run the App (Recommended)

1. **Start Expo server:**
   ```bash
   cd /Users/patjo/Dev/mf394-M/mf394-mobile
   npm start
   ```

2. **Open in browser:**
   - Press `w` in terminal, OR
   - Navigate to http://localhost:8081 (or port shown in terminal)

3. **Navigate to Add Contact screen**

4. **Scroll down to "Tags" section**
   - You should see a "Tags" label on the left
   - You should see an "Edit" button on the right (blue background, edit icon + text)

5. **Click the Edit button**
   - A modal should slide up from the bottom
   - You should see "Manage Tags" header
   - You should see an input field to add new tags
   - You should see a list of existing tags

### Option 2: Check Console Logs

With the app running, open browser DevTools (F12 → Console):

When you click Edit, you should see:
```
[AddEditContactScreen] Opening tag management modal
[TagManagementModal] Rendering with visible: true
```

If you don't see these logs, the button click isn't being registered.

### Option 3: Visual Inspection

The Edit button should look like this:
```
┌─────────────────────────────────┐
│ Tags                       Edit │  ← Blue badge with edit icon
├─────────────────────────────────┤
│ [tag1] [tag2] [tag3]           │
└─────────────────────────────────┘
```

---

## What the Modal Looks Like

When working correctly, clicking Edit shows:

```
┌─────────────────────────────────┐
│ [Dark semi-transparent overlay] │
│                                 │
│  ┌─────────────────────────────┐│
│  │ Manage Tags              ✕  ││
│  ├─────────────────────────────┤│
│  │ Add New Tag                 ││
│  │ [input field]    [Add]      ││
│  ├─────────────────────────────┤│
│  │ Existing Tags (5)           ││
│  │ • tag1                🗑️    ││
│  │ • tag2                🗑️    ││
│  │ • tag3                🗑️    ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

---

## Common Issues & Solutions

### Issue 1: "I don't see an Edit button"

**Possible Causes:**
- onEditTags prop not being passed
- Component not rendering

**Solution:**
Run this to verify:
```bash
grep -r "onEditTags={handleEditTags}" src/screens/
```

Should show:
- src/screens/AddEdit/AddEditContactScreen.tsx:434:  onEditTags={handleEditTags}
- src/screens/Party/PartyModeScreen.tsx:348:  onEditTags={handleEditTags}

### Issue 2: "Edit button exists but clicking does nothing"

**Possible Causes:**
- handleEditTags not setting state
- Modal not rendering

**Check console logs** - you should see:
```
[AddEditContactScreen] Opening tag management modal
```

If you don't see this, the click handler isn't firing.

### Issue 3: "Modal doesn't appear (but console logs show)"

**Possible Causes:**
- Modal rendering behind other elements
- React Native Modal not working on web

**Solution:**
We've added web-specific styles (fixed positioning, z-index: 9999)

**Verify the fix:**
```bash
grep -A 5 "overlay:" src/components/TagManagementModal/TagManagementModal.tsx
```

Should show web-specific styles with `position: 'fixed'` and `zIndex: 9999`

### Issue 4: "Nothing works, errors in console"

**Check for errors:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Copy and provide the full error

---

## Test Checklist

- [ ] Expo server is running
- [ ] Can open app in browser
- [ ] Can navigate to Add Contact screen
- [ ] Can see "Tags" section
- [ ] Can see "Edit" button next to "Tags" label
- [ ] Clicking Edit shows console log
- [ ] Modal slides up from bottom
- [ ] Can add a new tag
- [ ] Can delete an existing tag
- [ ] Can close modal by clicking X or overlay

---

## If Still Not Working

Please provide:

1. **Screenshot** of the Tags section (showing or not showing Edit button)
2. **Console output** (F12 → Console → copy all text)
3. **Which screen** you're testing (Add, Edit, or Party)
4. **Browser** and version (Chrome 120, Firefox 115, etc.)
5. **Operating system** (macOS, Windows, Linux)

Then I can provide a targeted fix!
