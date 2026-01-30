# ✅ Authentication Testing Checklist

## 🚀 Quick Start Testing Guide

### Prerequisites
```bash
# Terminal 1 - Start Backend
cd server
npm run dev

# Terminal 2 - Start Frontend  
cd client
npm run dev
```

---

## 📋 Test Scenarios

### ✅ Test 1: Sign Up Flow (New User)

**Steps:**
1. Open http://localhost:5173
2. Click "Start Project" button in header
3. Fill out registration form:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
4. Click "Sign up"

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Success toast: "Account created successfully"
- ✅ Redirected to `/app/dashboard`
- ✅ Dashboard shows user name
- ✅ Navigation shows: Dashboard, Projects, Messages
- ✅ Logout button visible

**Then:**
5. Navigate back to home page (/)

**Expected Results:**
- ✅ Header shows "Dashboard" link
- ✅ Header shows "Go to App" button
- ✅ "Login" and "Start Project" buttons are GONE

**Status:** [ ] PASS [ ] FAIL

---

### ✅ Test 2: Login Flow (Existing User)

**Steps:**
1. Open http://localhost:5173
2. Click "Login" in header
3. Enter credentials:
   - Email: test@example.com
   - Password: test123
4. Click "Sign in"

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Success toast: "Successfully signed in"
- ✅ Redirected to `/app/dashboard`
- ✅ User name displayed
- ✅ Logout button visible

**Then:**
5. Go back to home page (/)

**Expected Results:**
- ✅ Header updated to authenticated state
- ✅ Shows "Dashboard" and "Go to App"

**Status:** [ ] PASS [ ] FAIL

---

### ✅ Test 3: Protected Routes (Unauthenticated)

**Steps:**
1. Make sure you're logged out
2. Try to access: http://localhost:5173/app/dashboard

**Expected Results:**
- ✅ Immediately redirected to `/login`
- ✅ Cannot access protected page

**Then:**
3. Try to access: http://localhost:5173/app/projects

**Expected Results:**
- ✅ Redirected to `/login`

**Status:** [ ] PASS [ ] FAIL

---

### ✅ Test 4: Admin Access (Regular User)

**Steps:**
1. Login as regular user (test@example.com)
2. Try to access: http://localhost:5173/app/admin

**Expected Results:**
- ✅ Redirected to `/app/dashboard`
- ✅ Cannot access admin page
- ✅ No "Admin" link in navigation

**Then:**
3. Check home page header

**Expected Results:**
- ✅ No "Admin" link visible
- ✅ Only shows "Dashboard" and "Go to App"

**Status:** [ ] PASS [ ] FAIL

---

### ✅ Test 5: Admin Access (Admin User)

**Prerequisites:** Create admin user first
```bash
# In MongoDB or via API
# Set role: "admin" for a user
```

**Steps:**
1. Login as admin user
2. Check navigation

**Expected Results:**
- ✅ Navigation shows "Analytics" link
- ✅ Navigation shows "Users" link

**Then:**
3. Click "Analytics" or go to http://localhost:5173/app/admin

**Expected Results:**
- ✅ Admin dashboard loads successfully
- ✅ No redirect

**Then:**
4. Go to home page (/)

**Expected Results:**
- ✅ Header shows "Dashboard" link
- ✅ Header shows "Admin" link ← IMPORTANT!
- ✅ Header shows "Go to App" button

**Status:** [ ] PASS [ ] FAIL

---

### ✅ Test 6: Logout Flow

**Steps:**
1. Login as any user
2. Go to `/app/dashboard`
3. Click logout button

**Expected Results:**
- ✅ Redirected to `/login`
- ✅ Cannot access `/app/dashboard` anymore
- ✅ Token removed from localStorage

**Then:**
4. Go to home page (/)

**Expected Results:**
- ✅ Header shows "Login" and "Start Project"
- ✅ "Dashboard" and "Go to App" are GONE

**Status:** [ ] PASS [ ] FAIL

---

### ✅ Test 7: State Persistence (Page Refresh)

**Steps:**
1. Login as any user
2. Go to `/app/dashboard`
3. Press F5 (refresh page)

**Expected Results:**
- ✅ Still logged in
- ✅ Dashboard loads correctly
- ✅ User name still displayed
- ✅ No redirect to login

**Then:**
4. Go to home page (/)
5. Refresh page (F5)

**Expected Results:**
- ✅ Header still shows authenticated state
- ✅ "Dashboard" and "Go to App" still visible

**Status:** [ ] PASS [ ] FAIL

---

### ✅ Test 8: Invalid Credentials

**Steps:**
1. Go to `/login`
2. Enter invalid credentials:
   - Email: wrong@example.com
   - Password: wrongpass
3. Click "Sign in"

**Expected Results:**
- ✅ Error toast appears: "Invalid credentials"
- ✅ NOT redirected
- ✅ Form still visible
- ✅ Can try again

**Status:** [ ] PASS [ ] FAIL

---

### ✅ Test 9: Duplicate Email Registration

**Steps:**
1. Go to `/register`
2. Try to register with existing email
3. Click "Sign up"

**Expected Results:**
- ✅ Error toast: "User with this email already exists"
- ✅ NOT redirected
- ✅ Form still visible

**Status:** [ ] PASS [ ] FAIL

---

### ✅ Test 10: Form Validation

**Steps:**
1. Go to `/login`
2. Try to submit empty form

**Expected Results:**
- ✅ Validation errors shown
- ✅ "Required" message for email
- ✅ "Required" message for password
- ✅ Form not submitted

**Then:**
3. Enter invalid email format (e.g., "notanemail")

**Expected Results:**
- ✅ "Invalid email" error shown

**Status:** [ ] PASS [ ] FAIL

---

## 🎯 Header State Verification

### Test: Header Updates Immediately

**Scenario 1: Logged Out**
```
Expected Header:
[YANSY] [Work] [AR] [🌙] [Login] [Start Project]
```

**Scenario 2: Logged In (User)**
```
Expected Header:
[YANSY] [Work] [AR] [🌙] [Dashboard] [Go to App]
```

**Scenario 3: Logged In (Admin)**
```
Expected Header:
[YANSY] [Work] [AR] [🌙] [Dashboard] [Admin] [Go to App]
```

**Verification Steps:**
1. Start logged out → Check header ✅
2. Login → Check header immediately updates ✅
3. Go to home → Check header persists ✅
4. Refresh page → Check header still correct ✅
5. Logout → Check header reverts ✅

**Status:** [ ] PASS [ ] FAIL

---

## 🔍 Redux DevTools Verification

### Check State After Login

**Steps:**
1. Install Redux DevTools extension
2. Open DevTools
3. Login as user
4. Check Redux state

**Expected State:**
```javascript
{
  auth: {
    user: {
      id: "...",
      email: "test@example.com",
      name: "Test User",
      role: "client"
    },
    token: "eyJhbGc...",
    isAuthenticated: true,
    loading: false,
    error: null
  }
}
```

**Status:** [ ] PASS [ ] FAIL

---

## 🌐 Network Tab Verification

### Check API Calls

**Login Request:**
```
POST /api/auth/login
Request: { email, password }
Response: { user: {...}, token: "..." }
Status: 200 OK
```

**GetMe Request (on refresh):**
```
GET /api/auth/me
Headers: { Authorization: "Bearer ..." }
Response: { user: {...} }
Status: 200 OK
```

**Status:** [ ] PASS [ ] FAIL

---

## 🎨 Visual Verification

### Check UI Elements

**Login Page:**
- [ ] Form fields properly styled
- [ ] Loading spinner appears on submit
- [ ] Toast notifications appear
- [ ] Smooth animations

**Dashboard:**
- [ ] User name displayed
- [ ] Navigation links visible
- [ ] Logout button present
- [ ] Role-based links (admin only)

**Home Page Header:**
- [ ] Updates immediately after login
- [ ] Shows correct buttons for auth state
- [ ] Admin link visible for admins only

**Status:** [ ] PASS [ ] FAIL

---

## 🐛 Edge Cases

### Test: Multiple Rapid Logins

**Steps:**
1. Login
2. Immediately logout
3. Immediately login again
4. Check state

**Expected:** No errors, state correct

**Status:** [ ] PASS [ ] FAIL

---

### Test: Expired Token

**Steps:**
1. Login
2. Manually expire token (or wait)
3. Try to access protected route

**Expected:** Redirected to login

**Status:** [ ] PASS [ ] FAIL

---

### Test: Concurrent Tabs

**Steps:**
1. Open two tabs
2. Login in tab 1
3. Check tab 2

**Expected:** Tab 2 might not update (this is normal)
**After refresh:** Tab 2 should show logged in state

**Status:** [ ] PASS [ ] FAIL

---

## 📊 Performance Checks

### Check for Issues:
- [ ] No unnecessary re-renders
- [ ] No infinite loops
- [ ] No memory leaks
- [ ] Fast redirects
- [ ] Smooth animations

---

## ✅ Final Checklist

Before marking as production-ready:

- [ ] All 10 main tests pass
- [ ] Header updates correctly in all scenarios
- [ ] Protected routes work correctly
- [ ] Admin access control works
- [ ] State persists on refresh
- [ ] Error handling works
- [ ] Form validation works
- [ ] No console errors
- [ ] No linter errors
- [ ] Redux state correct
- [ ] API calls successful
- [ ] UI looks professional

---

## 🎯 Success Criteria

**Minimum Requirements:**
- ✅ 10/10 main tests pass
- ✅ Header updates immediately after login
- ✅ Admin routes work correctly
- ✅ No console errors
- ✅ Professional UX

**Production Ready When:**
- All checkboxes above are checked ✅
- No critical bugs found
- User experience is smooth and clear

---

## 📝 Test Results Log

**Tester:** _______________  
**Date:** _______________  
**Environment:** Development / Staging / Production  

**Overall Status:** [ ] PASS [ ] FAIL  

**Notes:**
```
_____________________________________________
_____________________________________________
_____________________________________________
```

---

**Last Updated:** 2026-01-02  
**Version:** 1.0.0  
**Status:** Ready for Testing ✅

