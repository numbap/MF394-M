# Mock Mode Manual Testing Checklist

## Prerequisites
- Ensure `.env` has `AUTH_MOCK=true`
- Clear browser localStorage: Open DevTools → Application → Local Storage → Clear All
- Start app: `npm start` then press `w` for web

---

## Test 1: Initial Load from mock_user.json ✓

**Steps:**
1. Open the app in browser
2. Navigate to Listing screen

**Expected:**
- Contacts from `src/mock_user.json` are displayed
- No errors in console

---

## Test 2: Add New Contact (Without Photo)

**Steps:**
1. Navigate to Add Contact screen
2. Fill in:
   - Name: "Test Contact 1"
   - Hint: "Test hint"
   - Category: Select any category
   - Tags: Select any tags (optional)
3. Click Save

**Expected:**
- ✅ Contact appears immediately in Listing
- ✅ No errors in console
- ✅ No localStorage persistence (check DevTools → Application → Local Storage)
- ✅ Navigates back to Listing with category/tag filters applied

**Console Check:**
- Should see: `[AddEditContactScreen] Skipping upload (mock mode or already uploaded)`
- Should NOT see: S3 upload attempts
- Should NOT see: API calls

---

## Test 3: Add New Contact (With Photo)

**Steps:**
1. Navigate to Add Contact screen
2. Upload/select a photo
3. Fill in:
   - Name: "Test Contact 2"
   - Category: Select any category
4. Click Save

**Expected:**
- ✅ Contact appears in Listing with local photo URI
- ✅ Photo displays correctly (no broken image)
- ✅ No S3 upload attempts
- ✅ No errors

**Console Check:**
- Should see: `AUTH_MOCK: true`
- Should see: `Skipping upload (mock mode...)`

---

## Test 4: Edit Existing Contact

**Steps:**
1. Long-press (or double-click) any contact card
2. Modify:
   - Name: Add " (Edited)"
   - Change category
   - Add/remove tags
3. Click Save

**Expected:**
- ✅ Changes reflect immediately in Listing
- ✅ Card shows updated name, category, tags
- ✅ No API calls
- ✅ No errors

---

## Test 5: Delete Contact

**Steps:**
1. Long-press any contact card
2. Click Delete
3. Confirm deletion

**Expected:**
- ✅ Contact removed from Listing immediately
- ✅ No API calls
- ✅ No errors

---

## Test 6: Party Mode (Bulk Add)

**Steps:**
1. Navigate to Party Mode
2. Upload a group photo (or use mock detection)
3. Name each detected face:
   - Face 1: "Party Person 1"
   - Face 2: "Party Person 2"
4. Select category and tags
5. Click Save All

**Expected:**
- ✅ All contacts appear in Listing
- ✅ Photos display correctly (local URIs)
- ✅ No S3 uploads
- ✅ No sync queue actions
- ✅ Console shows: `(demo)` instead of `(queued for sync)`

**Console Check:**
- Should see multiple: `Saved contact X/Y: <name> (demo)`
- Should NOT see: `queued for sync`

---

## Test 7: Tag Management

### 7a: Add New Tag

**Steps:**
1. Navigate to tag management screen
2. Enter new tag name: "test-tag"
3. Click Add

**Expected:**
- ✅ Tag appears in tag list immediately
- ✅ Tag available in contact forms
- ✅ No errors

### 7b: Delete Tag

**Steps:**
1. In tag management, click Delete on a tag
2. Confirm deletion

**Expected:**
- ✅ Tag removed from list
- ✅ Tag removed from all contacts that had it
- ✅ No errors

---

## Test 8: Session-Only Persistence (CRITICAL)

**Steps:**
1. Add/edit/delete several contacts
2. Note the changes you made
3. **Reload the browser page** (Cmd+R / Ctrl+R)
4. Check Listing screen

**Expected:**
- ✅ ALL changes are LOST (reverted)
- ✅ App shows original `mock_user.json` data
- ✅ This confirms session-only persistence is working

**If this fails:**
- Check DevTools → Application → Local Storage
- Should be EMPTY (no `contacts_v1` key)
- If you see stored contacts, mock mode is broken

---

## Test 9: Form Validation

**Steps:**
1. Navigate to Add Contact
2. Try to save with:
   - Empty name
   - Name only (no photo, no hint)
   - Photo only (no name)

**Expected:**
- ✅ Validation errors shown
- ✅ Save blocked until valid
- ✅ Clear error messages

---

## Test 10: Filtering & Navigation

**Steps:**
1. Add contacts with different categories/tags
2. Use category filter in Listing
3. Use tag filter in Listing
4. Navigate from Add/Edit screen with category selected

**Expected:**
- ✅ Filters work correctly
- ✅ Navigation preserves filter state
- ✅ Filters applied when returning from Add/Edit

---

## Known Issues / Expected Behavior

### Mock Mode Characteristics:
- ✅ No network requests
- ✅ No S3 uploads
- ✅ No sync queue actions
- ✅ No localStorage/AsyncStorage persistence
- ✅ All changes in Redux only
- ✅ App resets to `mock_user.json` on reload

### Console Warnings (OK):
- Face detector warnings (expected in test env)
- SafeAreaView deprecation (doesn't affect functionality)

---

## Troubleshooting

### Issue: Changes persist after reload
**Solution:**
- Clear browser localStorage
- Verify `.env` has `AUTH_MOCK=true`
- Restart dev server

### Issue: Photos not displaying
**Solution:**
- Check local file URI format
- Verify browser allows local file access
- Try with hint-only contacts first

### Issue: Console shows API calls
**Solution:**
- Verify `AUTH_MOCK=true` in `.env`
- Check `AUTH_MOCK` value in console logs
- Restart dev server after changing `.env`

---

## Success Criteria

All tests must pass with:
- ✅ No errors in console (warnings OK)
- ✅ No API calls or network requests
- ✅ No localStorage persistence
- ✅ Session-only state (resets on reload)
- ✅ All CRUD operations work (Create, Read, Update, Delete)
- ✅ Tag management works
- ✅ Party mode works
- ✅ Filters work

---

## Reporting Issues

If any test fails:
1. Note which test number failed
2. Copy exact error message from console
3. Screenshot of the issue
4. Include browser and OS version
