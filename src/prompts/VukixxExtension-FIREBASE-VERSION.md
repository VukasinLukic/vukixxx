# VukixxExtension — Chrome Extension Master Prompt (Firebase Version)

> Use this prompt to build the Chrome Extension in a **separate repository** (`VukixxExtension`).
> It captures prompts from ChatGPT, Claude, Gemini, and Midjourney and saves them to Firebase Firestore.
> The Vukixxx desktop app listens to Firebase and auto-syncs new prompts locally.

---

## 🎯 Project Goal

Build a Chrome Extension called **VukixxExtension** that adds a "Save to Vukixxx" button on ChatGPT, Claude, Gemini, and Midjourney web pages. When clicked, it:

1. **Captures** the current prompt text
2. **Sends to Gemini AI** for auto-classification (title, category, tags)
3. **Saves to Firebase Firestore** (cloud database)
4. **Desktop app auto-syncs** and saves as local `.md` file

**No Native Messaging needed** — everything goes through Firebase!

---

## 📁 Tech Stack

- **Manifest V3** (Chrome Extension)
- **TypeScript** + **Vite** for build
- **React** for popup UI
- **Content Scripts** for ChatGPT, Claude, Gemini, Midjourney DOM injection
- **Firebase Firestore** — cloud database for prompt sync
- **Gemini AI** — for auto-classification (title, category, tags)
- **Chrome Storage API** — for settings persistence

---

## 🏗️ Architecture

```
VukixxExtension/
├── manifest.json              # Manifest V3
├── vite.config.ts             # Build config
├── package.json
├── tsconfig.json
├── .env.example               # Environment variables template
├── .gitignore
├── src/
│   ├── background/
│   │   └── service-worker.ts  # Background service worker
│   ├── content/
│   │   ├── chatgpt.ts         # Content script for ChatGPT
│   │   ├── claude.ts          # Content script for Claude.ai
│   │   ├── gemini.ts          # Content script for Gemini
│   │   ├── midjourney.ts      # Content script for Midjourney
│   │   └── inject-button.ts   # Shared button injection logic
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.tsx          # React popup UI
│   │   └── popup.css
│   ├── services/
│   │   ├── firebase.ts        # Firebase Firestore service
│   │   └── gemini.ts          # Gemini AI classification service
│   ├── shared/
│   │   ├── types.ts           # Shared TypeScript types
│   │   ├── messaging.ts       # Chrome messaging helpers
│   │   └── storage.ts         # Chrome storage helpers
│   └── assets/
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
└── README.md
```

---

## 📋 manifest.json

```json
{
  "manifest_version": 3,
  "name": "VukixxExtension",
  "version": "1.0.0",
  "description": "Save prompts from ChatGPT, Claude, Gemini, and Midjourney to Vukixxx",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "https://www.midjourney.com/*",
    "https://firestore.googleapis.com/*",
    "https://generativelanguage.googleapis.com/*"
  ],
  "background": {
    "service_worker": "src/background/service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://chat.openai.com/*", "https://chatgpt.com/*"],
      "js": ["src/content/chatgpt.js"],
      "css": ["src/content/vukixx-button.css"]
    },
    {
      "matches": ["https://claude.ai/*"],
      "js": ["src/content/claude.js"],
      "css": ["src/content/vukixx-button.css"]
    },
    {
      "matches": ["https://gemini.google.com/*"],
      "js": ["src/content/gemini.js"],
      "css": ["src/content/vukixx-button.css"]
    },
    {
      "matches": ["https://www.midjourney.com/*"],
      "js": ["src/content/midjourney.js"],
      "css": ["src/content/vukixx-button.css"]
    }
  ],
  "action": {
    "default_popup": "src/popup/popup.html",
    "default_icon": {
      "16": "src/assets/icon-16.png",
      "48": "src/assets/icon-48.png",
      "128": "src/assets/icon-128.png"
    }
  },
  "icons": {
    "16": "src/assets/icon-16.png",
    "48": "src/assets/icon-48.png",
    "128": "src/assets/icon-128.png"
  }
}
```

---

## 🔥 Firebase Setup

### Firestore Database Structure

**Collection**: `prompts`

**Document Fields**:
```typescript
interface FirestorePrompt {
  id: string;          // Auto-generated document ID
  text: string;        // Full prompt text
  title: string;       // AI-generated title (from Gemini)
  category: string;    // AI category: "Technical", "Creative", "Marketing", etc.
  tags: string[];      // AI-generated tags
  source: 'chatgpt' | 'claude' | 'gemini' | 'midjourney';
  sourceUrl: string;   // URL where captured
  created: Timestamp;  // Firebase server timestamp
  updated: Timestamp;  // Firebase server timestamp
}
```

### Firebase Configuration (Web SDK)

```typescript
// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function savePromptToFirebase(promptData: {
  text: string;
  title: string;
  category: string;
  tags: string[];
  source: string;
  sourceUrl: string;
}) {
  const docRef = await addDoc(collection(db, 'prompts'), {
    ...promptData,
    created: serverTimestamp(),
    updated: serverTimestamp(),
  });
  return docRef.id;
}
```

---

## 🤖 Gemini AI Classification

### Service Implementation

```typescript
// src/services/gemini.ts
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface ClassificationResult {
  title: string;
  category: string;
  tags: string[];
  confidence: number;
}

export async function classifyPrompt(promptText: string): Promise<ClassificationResult> {
  const prompt = `Analyze this prompt and generate:
1. A concise title (max 60 chars)
2. Category: Technical, Creative, Marketing, Business, or Other
3. 2-4 relevant tags (single words, lowercase)

Respond ONLY with valid JSON:
{
  "title": "...",
  "category": "...",
  "tags": ["...", "..."],
  "confidence": 0.85
}

Prompt to analyze:
${promptText}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 200,
      }
    })
  });

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;

  // Extract JSON from response (may have markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response');

  return JSON.parse(jsonMatch[0]);
}
```

---

## 🔌 Content Scripts — How They Work

### Universal Flow

1. **Inject "Save to Vukixxx" button** near prompt input
2. **On button click**:
   - Capture prompt text from DOM
   - Send to background script
3. **Background script**:
   - Call Gemini AI to classify (title, category, tags)
   - Save to Firebase Firestore
   - Show success notification
4. **Desktop app** (auto-running):
   - Real-time listener on Firebase
   - New prompt arrives → Save to local `.md` file
   - User sees toast notification

### ChatGPT (`chatgpt.ts`)

```typescript
// Observe for prompt textarea
const observer = new MutationObserver(() => {
  const textarea = document.querySelector('#prompt-textarea');
  if (textarea && !document.querySelector('.vukixx-save-btn')) {
    injectSaveButton(textarea);
  }
});

function injectSaveButton(textarea: Element) {
  const btn = createSaveButton(() => {
    const text = (textarea as HTMLTextAreaElement).value;
    if (text) {
      chrome.runtime.sendMessage({
        type: 'SAVE_PROMPT',
        payload: {
          text,
          source: 'chatgpt',
          url: window.location.href,
        }
      });
    }
  });

  textarea.parentElement?.appendChild(btn);
}
```

### Claude (`claude.ts`)

```typescript
// Claude uses contenteditable div
const observer = new MutationObserver(() => {
  const promptDiv = document.querySelector('[contenteditable="true"]');
  if (promptDiv && !document.querySelector('.vukixx-save-btn')) {
    injectSaveButton(promptDiv);
  }
});

function injectSaveButton(promptDiv: Element) {
  const btn = createSaveButton(() => {
    const text = promptDiv.textContent || '';
    if (text.trim()) {
      chrome.runtime.sendMessage({
        type: 'SAVE_PROMPT',
        payload: {
          text: text.trim(),
          source: 'claude',
          url: window.location.href,
        }
      });
    }
  });

  promptDiv.parentElement?.appendChild(btn);
}
```

### Gemini (`gemini.ts`)

```typescript
// Gemini has unique DOM structure
const observer = new MutationObserver(() => {
  const inputArea = document.querySelector('.ql-editor');
  if (inputArea && !document.querySelector('.vukixx-save-btn')) {
    injectSaveButton(inputArea);
  }
});
```

### Shared Button Component (`inject-button.ts`)

```typescript
export function createSaveButton(onSave: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'vukixx-save-btn';
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
    Save to Vukixxx
  `;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      await onSave();
      btn.classList.add('vukixx-saved');
      btn.innerHTML = '✓ Saved!';
      setTimeout(() => {
        btn.classList.remove('vukixx-saved');
        btn.innerHTML = 'Save to Vukixxx';
        btn.disabled = false;
      }, 2000);
    } catch (err) {
      btn.innerHTML = '✗ Failed';
      setTimeout(() => {
        btn.innerHTML = 'Save to Vukixxx';
        btn.disabled = false;
      }, 2000);
    }
  });

  return btn;
}
```

---

## 🔗 Background Service Worker

```typescript
// src/background/service-worker.ts
import { classifyPrompt } from '../services/gemini';
import { savePromptToFirebase } from '../services/firebase';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_PROMPT') {
    handleSavePrompt(message.payload)
      .then(result => sendResponse({ success: true, ...result }))
      .catch(error => sendResponse({ success: false, error: error.message }));

    return true; // Keep channel open for async response
  }
});

async function handleSavePrompt(payload: {
  text: string;
  source: string;
  url: string;
}) {
  // Step 1: Classify with Gemini AI
  const classification = await classifyPrompt(payload.text);

  // Step 2: Save to Firebase
  const docId = await savePromptToFirebase({
    text: payload.text,
    title: classification.title,
    category: classification.category,
    tags: classification.tags,
    source: payload.source,
    sourceUrl: payload.url,
  });

  // Step 3: Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/icon-48.png',
    title: 'Prompt Saved!',
    message: `"${classification.title}" saved to Vukixxx`,
  });

  return {
    promptId: docId,
    title: classification.title,
  };
}
```

---

## 🎨 Popup UI (Vukixxx Design System)

Use the **VUKIXXX-DESIGN-SYSTEM-PROMPT.md** for exact styling.

### Key Features:
- Recent saves (last 10)
- Sync status indicator (connected to Firebase)
- Settings: Gemini API key, Firebase config
- "Open Vukixxx Desktop" button (optional - launches app via protocol handler)

### Popup Layout:

```tsx
// src/popup/popup.tsx
import React, { useEffect, useState } from 'react';
import { getRecentPrompts } from '../services/firebase';

export function Popup() {
  const [recentPrompts, setRecentPrompts] = useState([]);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    loadRecentPrompts();
  }, []);

  async function loadRecentPrompts() {
    const prompts = await getRecentPrompts(10);
    setRecentPrompts(prompts);
    setSyncing(false);
  }

  return (
    <div className="vukixx-popup">
      <div className="popup-header">
        <h1>Vukixxx Extension</h1>
        <div className={`status-indicator ${syncing ? 'syncing' : 'connected'}`}>
          {syncing ? 'Syncing...' : 'Connected'}
        </div>
      </div>

      <div className="popup-body">
        <h2>Recent Saves</h2>
        {recentPrompts.length === 0 ? (
          <div className="empty-state">
            No prompts saved yet. Click "Save to Vukixxx" on any AI chat!
          </div>
        ) : (
          <div className="prompt-list">
            {recentPrompts.map(prompt => (
              <div key={prompt.id} className="prompt-item">
                <div className="prompt-title">{prompt.title}</div>
                <div className="prompt-meta">
                  <span className="prompt-source">{prompt.source}</span>
                  <span className="prompt-category">{prompt.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="popup-footer">
        <button className="btn-primary" onClick={() => window.open('vukixxx://')}>
          Open Vukixxx Desktop
        </button>
      </div>
    </div>
  );
}
```

---

## 📝 Environment Variables

### `.env.example`

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123

# Gemini AI API Key
VITE_GEMINI_API_KEY=AIzaSy...
```

### `.gitignore`

```
node_modules/
dist/
.env
.env.local
*.log
```

---

## 🚀 Implementation Checklist

### Phase 1: Setup
- [ ] Init Vite + React + TypeScript project
- [ ] Add Firebase SDK (`npm install firebase`)
- [ ] Add manifest.json with all permissions
- [ ] Create `.env.local` with Firebase + Gemini credentials
- [ ] Setup Vite to bundle extension properly

### Phase 2: Services
- [ ] Implement `firebase.ts` service
- [ ] Implement `gemini.ts` AI classification service
- [ ] Test classification API directly

### Phase 3: Content Scripts
- [ ] Implement ChatGPT content script
- [ ] Implement Claude content script
- [ ] Implement Gemini content script
- [ ] Implement Midjourney content script
- [ ] Create shared button component with Vukixxx design

### Phase 4: Background Worker
- [ ] Implement service worker message handling
- [ ] Connect to Gemini API for classification
- [ ] Save to Firebase Firestore
- [ ] Add success notifications

### Phase 5: Popup UI
- [ ] Build React popup with Vukixxx design system
- [ ] Show recent saves from Firebase
- [ ] Add sync status indicator
- [ ] Add settings panel (optional)

### Phase 6: Testing
- [ ] Test on ChatGPT (chat.openai.com)
- [ ] Test on Claude (claude.ai)
- [ ] Test on Gemini (gemini.google.com)
- [ ] Test on Midjourney (midjourney.com)
- [ ] Verify desktop app receives & saves prompts

### Phase 7: Polish
- [ ] Add error handling & retry logic
- [ ] Add offline support (queue prompts)
- [ ] Add keyboard shortcuts (optional)
- [ ] Package for Chrome Web Store

---

## 🔒 Security Notes

- **API Keys**: NEVER commit `.env` or `.env.local` to git
- **Firebase Rules**: Set Firestore rules to allow writes only from extension
- **Gemini Quota**: Free tier = 15 req/min, 1500/day
- **CORS**: Extension has special permissions, no CORS issues

---

## 📦 Build & Deploy

### Development:
```bash
npm install
npm run dev
# Load unpacked extension from dist/ folder in Chrome
```

### Production Build:
```bash
npm run build
# Creates optimized dist/ folder
# Zip dist/ folder
# Upload to Chrome Web Store
```

---

## 🎯 How It All Works Together

1. **User** types prompt in ChatGPT/Claude/Gemini/Midjourney
2. **Extension** shows "Save to Vukixxx" button
3. **User clicks** button
4. **Extension**:
   - Sends prompt to Gemini AI for classification
   - Saves classified prompt to Firebase Firestore
5. **Vukixxx Desktop App** (running in background):
   - Real-time listener on Firebase
   - New document appears → Downloads it
   - Saves as `.md` file in prompts folder
   - Shows toast: "New prompt synced: [title]"
6. **User** sees prompt instantly in Vukixxx app

**No complex setup, no native messaging, just Firebase magic!** ✨

---

**Use VUKIXXX-DESIGN-SYSTEM-PROMPT.md for exact styling to match desktop app.**
