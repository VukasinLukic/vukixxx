# Firebase Integration - Setup Guide

Vukixxx desktop app integrates with Firebase Firestore to receive prompts from the Chrome Extension in real-time.

---

## 🔥 How It Works

```
Chrome Extension (ChatGPT/Claude/etc.)
    ↓
Saves prompt to Firebase Firestore
    ↓
Vukixxx Desktop App (real-time listener)
    ↓
Auto-saves as .md file locally
```

---

## 📋 Prerequisites

1. **Firebase Project**: Create at https://console.firebase.google.com
2. **Firestore Database**: Enable Firestore in your Firebase project
3. **Gemini API Key**: Get from https://aistudio.google.com/apikey

---

## 🚀 Setup Steps

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it: `vukixxx-[your-name]`
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### 2. Enable Firestore

1. In Firebase Console, click **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll secure it later)
4. Select location (closest to you)
5. Click **"Enable"**

### 3. Get Firebase Config

1. In Firebase Console, click ⚙️ (Settings) → **"Project settings"**
2. Scroll down to **"Your apps"**
3. Click **"Web"** icon (</>) to add a web app
4. Name it: `Vukixxx Desktop`
5. Copy the `firebaseConfig` object

### 4. Create `.env.local` File

Create `c:\Vukixxx\.env.local` (or copy from `.env.example`):

```bash
# AI Provider
VITE_AI_PROVIDER=gemini
VITE_GEMINI_API_KEY=AIzaSy...your-key...

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=vukixxx-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=vukixxx-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=vukixxx-xxxxx.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

**IMPORTANT**: `.env.local` is already in `.gitignore` - your credentials are safe!

### 5. Run Vukixxx

```bash
npm install
npm run tauri dev
```

The app will automatically:
- Initialize Firebase on startup
- Listen for new prompts
- Save them to `C:\Users\<you>\.vukixxx\prompts\`

---

## 🔒 Firestore Security Rules (Production)

⚠️ **Before deploying the Chrome Extension**, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /prompts/{promptId} {
      // Allow extension to write prompts
      allow create: if request.auth == null; // Public writes (for now)

      // Allow desktop app to read prompts
      allow read: if request.auth == null;

      // Deny updates and deletes
      allow update, delete: if false;
    }
  }
}
```

**For production**, consider:
1. Anonymous auth for extension
2. API key validation
3. Rate limiting

---

## 🧪 Testing

### Test Firebase Connection

1. Start Vukixxx desktop app
2. Check console for:
   ```
   🔥 [Firebase] Initializing Firebase app...
   ✅ [Firebase] Firebase initialized successfully
   🔄 [FirebaseSync] Starting real-time sync...
   ✅ [FirebaseSync] Sync initialized, listening for new prompts...
   ```

### Test Prompt Sync

1. Open Firebase Console → Firestore
2. Manually add a document to `prompts` collection:
   ```json
   {
     "text": "Test prompt content",
     "title": "Test Prompt",
     "category": "Technical",
     "tags": ["test", "demo"],
     "source": "chatgpt",
     "sourceUrl": "https://chatgpt.com/test",
     "created": [Timestamp - now],
     "updated": [Timestamp - now]
   }
   ```
3. Watch Vukixxx console - should see:
   ```
   🆕 [FirebaseSync] New prompt from chatgpt: Test Prompt
   💾 [FirebaseSync] Saved: test-prompt-1234567890.md
   ```
4. Check `C:\Users\<you>\.vukixxx\prompts\` - file should exist!

---

## 🐛 Troubleshooting

### "Firebase initialization failed"

**Check**:
1. `.env.local` exists and has all variables
2. Firebase config values are correct
3. Internet connection is active
4. Firestore database is enabled in Firebase Console

### "No prompts syncing"

**Check**:
1. Firestore rules allow reads/writes
2. Chrome Extension is saving to correct Firebase project
3. Desktop app console shows "listening for new prompts"
4. Firebase Console → Firestore shows documents in `prompts` collection

### Prompts not saving locally

**Check**:
1. `C:\Users\<you>\.vukixxx\prompts\` folder exists
2. No permission errors in console
3. Prompt has valid title/content

---

## 📊 Monitoring

### View Real-Time Sync

Open DevTools (F12) in Vukixxx app and watch console for:

```
🔄 [FirebaseSync] Starting real-time sync...
✅ [FirebaseSync] Sync initialized, listening for new prompts...
🆕 [FirebaseSync] New prompt from chatgpt: Example Title
💾 [FirebaseSync] Saved: example-title-1234567890.md
📥 [App] New prompt synced from extension: Example Title
```

### Firebase Console

Check Firestore in Firebase Console to see all saved prompts.

---

## 🔄 How to Disable Firebase Sync

If you don't want to use the Chrome Extension:

1. Simply don't add Firebase credentials to `.env.local`
2. App will log a warning but continue working normally
3. You can still manually create prompts in the desktop app

Firebase sync is **completely optional**!

---

## 💡 Tips

- **Offline Support**: Desktop app must be online to sync from Firebase
- **Auto-Reload**: Once synced, prompts appear instantly (file watcher updates UI)
- **Conflicts**: Firebase prompts are saved with timestamp in filename to avoid conflicts
- **Storage**: Firebase free tier = 1 GB storage, 50k reads/day, 20k writes/day (more than enough!)

---

## 📝 Example Firestore Document

```json
{
  "id": "backend-api-example-1709876543210",
  "text": "Create a REST API for user management with JWT authentication, rate limiting, and error handling.",
  "title": "Backend API - User Management",
  "category": "Technical",
  "tags": ["api", "rest", "nodejs", "jwt"],
  "source": "chatgpt",
  "sourceUrl": "https://chatgpt.com/c/abc123",
  "created": "2026-03-05T22:15:43.210Z",
  "updated": "2026-03-05T22:15:43.210Z"
}
```

This becomes `backend-api-example-1709876543210.md` in your prompts folder!

---

**Firebase integration complete! 🎉**

Now install the Chrome Extension to start capturing prompts automatically.
