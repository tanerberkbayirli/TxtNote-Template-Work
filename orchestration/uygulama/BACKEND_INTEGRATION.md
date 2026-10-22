# TxtNote Backend Integration Guide

## Architecture Overview

```
Frontend (Privy)  →  Verify Token  →  Backend API  →  Database
    ↓                                      ↓
User logs in with                  Create session,
email/social/wallet                store user record
    ↓
Redirect to app
```

## Issues to Fix

### 1. Frontend: LoginPage Callback
**File**: `frontend/src/features/auth/LoginPage.jsx`

The component receives `onAuthenticated` prop from AuthGate but doesn't use it. Need to:
- Extract the prop
- Call it after successful authentication
- Let AuthGate handle the redirect (not window.location.href)

### 2. Frontend: useAuthHandlers Integration
**File**: `frontend/src/features/auth/useAuthHandlers.js`

After Privy authentication succeeds:
1. Get Privy's ID token
2. Send it to backend `/auth/login` endpoint
3. Backend verifies with Privy and returns session token
4. Store session token in localStorage (not sessionStorage)
5. Use token for all subsequent API requests

### 3. Backend: Authentication API
Need to create backend endpoints:

```
POST /auth/login
  Input: { privyToken, method: "email|social|wallet" }
  Output: { sessionToken, user: { id, email, displayName } }

GET /auth/verify
  Input: Authorization: Bearer <sessionToken>
  Output: { user: { ... }, valid: true }

POST /auth/logout
  Input: Authorization: Bearer <sessionToken>
  Output: { success: true }
```

### 4. Backend: User Database
Schema:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  privy_id TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  auth_method TEXT,  -- email, google, twitter, etc.
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

### 5. Frontend: Session Management
**New file**: `frontend/src/services/sessionManager.js`

```javascript
export async function loginWithPrivy(privyToken, method) {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ privyToken, method })
  });
  
  if (!response.ok) throw new Error('Login failed');
  
  const data = await response.json();
  sessionStorage.setItem('session_token', data.sessionToken);
  return data;
}

export function getSessionToken() {
  return sessionStorage.getItem('session_token');
}

export async function apiRequest(endpoint, options = {}) {
  const token = getSessionToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  const response = await fetch(`http://localhost:3000${endpoint}`, {
    ...options,
    headers
  });
  
  if (response.status === 401) {
    // Token expired, redirect to login
    sessionStorage.removeItem('session_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  return response.json();
}
```

### 6. Frontend: Update useAuthHandlers
**File**: `frontend/src/features/auth/useAuthHandlers.js`

```javascript
export function useAuthHandlers() {
  // ... existing code ...
  
  const handleEmailVerifyCode = async (code) => {
    try {
      await loginWithEmail.loginWithCode({ code });
      
      // Get Privy token
      const token = privy.user?.idToken;
      if (!token) throw new Error('No auth token');
      
      // Send to backend
      const result = await loginWithPrivy(token, 'email');
      storeVaultKeyInSession(vaultKey);
      
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };
  
  // Similar updates for social and wallet handlers
}
```

### 7. Frontend: Update LoginPage
**File**: `frontend/src/features/auth/LoginPage.jsx`

```javascript
export const LoginPage = ({ onAuthenticated }) => {
  // ... existing code ...
  
  const handleVerifyCode = async () => {
    setError("");
    setLoading(true);
    const result = await auth.handleEmailVerifyCode(code);
    setLoading(false);
    if (result.success) {
      // Call the callback instead of redirect
      onAuthenticated({
        method: 'email',
        email: email,
        displayName: result.user?.displayName
      });
    } else {
      setError(result.error);
    }
  };
  
  // Same for wallet and social handlers
};
```

### 8. Frontend: Update AuthGate
**File**: `frontend/src/features/auth/AuthGate.jsx`

Make sure it passes the callback:

```javascript
{authed ? <App /> : <LoginPage onAuthenticated={handleAuthenticated} />}
```

This is already correct ✅

## Implementation Steps

### Step 1: Create Backend (Node.js + Express example)

```javascript
// backend/src/server.js
import express from 'express';
import { PrivyClient } from '@privy-io/server-auth';

const app = express();
const privy = new PrivyClient({
  appId: process.env.PRIVY_APP_ID,
  appSecret: process.env.PRIVY_APP_SECRET,
});

// User database (in-memory for now, use PostgreSQL in production)
const users = new Map();
const sessions = new Map();

app.post('/auth/login', async (req, res) => {
  try {
    const { privyToken, method } = req.body;
    
    // Verify token with Privy
    const verifiedClaims = await privy.verifyAuthToken(privyToken);
    const privyUserId = verifiedClaims.sub;
    
    // Check if user exists
    let user = [...users.values()].find(u => u.privy_id === privyUserId);
    
    if (!user) {
      // Create new user
      user = {
        id: crypto.randomUUID(),
        privy_id: privyUserId,
        email: verifiedClaims.email,
        display_name: verifiedClaims.name,
        auth_method: method,
        created_at: new Date(),
      };
      users.set(user.id, user);
    }
    
    // Create session token
    const sessionToken = crypto.randomUUID();
    sessions.set(sessionToken, {
      user_id: user.id,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
    
    res.json({
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  const session = sessions.get(token);
  if (!session) return res.status(401).json({ error: 'Invalid token' });
  
  if (new Date() > session.expires_at) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Token expired' });
  }
  
  const user = users.get(session.user_id);
  res.json({ user, valid: true });
});

app.listen(3000, () => console.log('Backend running on :3000'));
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm init -y
npm install express @privy-io/server-auth dotenv
npm install -D nodemon
```

### Step 3: Create .env.backend

```
PRIVY_APP_ID=cmtrlui6400no0ckzpydyyhx1
PRIVY_APP_SECRET=YOUR_SECRET_FROM_PRIVY_DASHBOARD
```

### Step 4: Update Frontend LoginPage & useAuthHandlers

See sections above with concrete code examples.

### Step 5: Test the Flow

1. **Start backend**: `cd backend && npm start`
2. **Start frontend**: `cd frontend && npm run dev`
3. **Go to** http://localhost:5173/login
4. **Try email OTP**:
   - Enter email
   - Check spam folder for OTP code
   - Enter code
   - Should now redirect to app ✅

## Debugging

### Problem: "VITE_PRIVY_APP_ID is undefined"
- Check `.env` file exists with correct value
- Restart `npm run dev`

### Problem: "Login failed" when entering code
- Open browser console (F12)
- Check for network errors
- Backend must be running on http://localhost:3000

### Problem: Page redirects to /login after refresh
- Session token not persisted correctly
- Check `sessionStorage` has `session_token`
- Backend session might have expired

## Next: Database & Encryption

After basic auth works:
1. Add PostgreSQL for persistent user storage
2. Store encrypted note payloads
3. Implement vault key hash for recovery
4. Add logout and account recovery
