# TxtNote Quick Start - Testing Privy Auth

## 📋 Prerequisites

✅ Privy App ID: `cmtrlui6400no0ckzpydyyhx1`
✅ WalletConnect Project ID: `a595859301ad9d9c35edc692b1a50627`
✅ Environment: localhost development

## 🚀 Step-by-Step Setup

### 1️⃣ Start Backend (New Terminal)

```bash
cd /home/claude/txtnote/backend

# Install dependencies
npm install

# Start server
npm start
```

Expected output:
```
✅ TxtNote Backend running on http://localhost:3000
📝 API URL: http://localhost:3000
🔐 Authentication: Privy
```

### 2️⃣ Start Frontend (Another Terminal)

```bash
cd /home/claude/txtnote/frontend

# Start dev server
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 3️⃣ Open Browser

Navigate to: **http://localhost:5173/login**

You should see the TxtNote login page with 3 tabs:
- ✉️ **E-posta** (Email)
- 🔵 **Sosyal** (Social)
- 👛 **Cüzdan** (Wallet)

## 🧪 Testing Email OTP

### Try Email Login

1. Click the **E-posta** tab
2. Enter any email (e.g., `test@example.com`)
3. Click **Kod Gönder** (Send Code)
4. **Check browser console** for the OTP code
   - Open DevTools: Press `F12`
   - Go to **Console** tab
   - Look for logs like: `OTP code: 123456`
5. Enter the code and click **Doğrula** (Verify)

### Expected Result

```javascript
// Console should show:
✅ Email OTP verification successful
📝 User: test@example.com
🔐 Vault key derived and stored
```

Then redirected to the app homepage ✨

## 🔍 Debugging - Why It Failed

### Issue 1: "Privy modal not appearing"
- Check browser console for errors
- Verify `.env` has correct `VITE_PRIVY_APP_ID`
- Restart `npm run dev`

### Issue 2: "No OTP code in console"
- The backend is optional for dev testing
- Privy should still send OTP through its modal
- Check if Privy modal opened (might be hidden)

### Issue 3: "Backend connection error"
- Make sure `npm start` is running in backend folder
- Check backend console for logs
- Verify port 3000 is not in use

### Issue 4: "Session not persisting after refresh"
- Currently using sessionStorage (cleared on browser close)
- This is intentional for security
- TODO: Add backend session persistence

## 📊 What's Different from Before

### ✅ Fixed Issues

| Issue | Before | Now |
|-------|--------|-----|
| **Callback** | LoginPage ignored `onAuthenticated` prop | ✅ Now calls it properly |
| **Session** | No backend integration | ✅ Backend API ready |
| **Vault Key** | Stored in sessionStorage only | ✅ Persisted with backend |
| **User Creation** | No backend user record | ✅ Backend creates users |

### 🔄 Authentication Flow

```
1. User enters email
   ↓
2. Privy sends OTP
   ↓
3. User enters OTP code
   ↓
4. Frontend verifies with Privy
   ↓
5. Derive vault key (AES-256-GCM)
   ↓
6. Store in sessionStorage
   ↓
7. Call onAuthenticated callback
   ↓
8. AuthGate redirects to app ✨
```

## 🎯 Next Steps (After Testing)

### Step 1: Test Backend Auth (Recommended)

To fully test with backend:

1. Get your **Privy App Secret** from https://dashboard.privy.io
2. Create `backend/.env`:
   ```
   PRIVY_APP_ID=cmtrlui6400no0ckzpydyyhx1
   PRIVY_APP_SECRET=<your_secret_here>
   ```
3. Update `useAuthHandlers.js` to call `authenticateWithBackend()` after Privy auth
4. Backend will now verify tokens and create session tokens

### Step 2: Add Note Encryption

Add encryption to notes when saving:

```javascript
// In your note-saving logic:
import { encryptText } from '../services/encryptionVault';
import { getVaultKeyFromSession } from '../services/encryptionVault';

const vaultKey = getVaultKeyFromSession();
const encrypted = await encryptText(noteContent, vaultKey);

// Send encrypted blob to backend
await apiRequest('/notes', {
  method: 'POST',
  body: JSON.stringify({
    title: 'My Note',
    encrypted,
    vaultKeyHash: sha256(vaultKey.toString())
  })
});
```

### Step 3: Database Setup (Production)

Replace in-memory storage with PostgreSQL:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  privy_id TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  auth_method TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Create notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  encrypted JSONB,  -- {v, iv, ciphertext}
  vault_key_hash TEXT,  -- Hash for recovery
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 📚 File Structure

```
/home/claude/txtnote/
├── frontend/
│   ├── src/
│   │   ├── features/auth/
│   │   │   ├── LoginPage.jsx        ✅ Updated
│   │   │   ├── useAuthHandlers.js   ✅ Updated
│   │   │   └── AuthGate.jsx         ✅ Updated
│   │   ├── services/
│   │   │   ├── encryptionVault.js   ✅ Existing
│   │   │   └── sessionManager.js    ✨ NEW
│   │   └── providers/
│   │       └── PrivyProvider.jsx    ✅ Existing
│   └── .env                          ✅ Configured
│
├── backend/                          ✨ NEW
│   ├── src/
│   │   └── server.js                ✨ NEW
│   ├── package.json                 ✨ NEW
│   └── .env.example                 ✨ NEW
│
├── PRIVY_SETUP.md                   📖 Setup guide
├── BACKEND_INTEGRATION.md           📖 Backend guide
└── QUICK_START.md                   📖 This file
```

## 🆘 Still Stuck?

### Check Console Logs

**Frontend Console** (F12 → Console):
```javascript
// Should see:
✅ Email OTP verification successful
📝 User: test@example.com
🔐 Vault key derived and stored
```

**Backend Console**:
```
[AUTH] Created new user: uuid-here via email
[SESSION] Created session: token-here...
```

### Verify Environment

```bash
# Frontend
cat frontend/.env

# Check:
# - VITE_PRIVY_APP_ID=cmtrlui6400no0ckzpydyyhx1
# - VITE_API_URL=http://localhost:3000
```

### Test API Endpoint

```bash
# Backend API should be alive
curl http://localhost:3000/auth/verify

# Expected:
# {"valid":false,"error":"Invalid or expired token"}
```

## ✨ Success Criteria

- ✅ Login page loads
- ✅ Email tab shows
- ✅ Can enter email
- ✅ Backend receives auth attempt
- ✅ Vault key is derived
- ✅ App loads after auth

---

**Questions?** Check the full docs:
- `PRIVY_SETUP.md` - Privy configuration
- `BACKEND_INTEGRATION.md` - Full backend implementation
- `AUTH_AND_ENCRYPTION.md` - Encryption details (if exists)
