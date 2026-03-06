# VukixxExtension — Chrome Extension Master Prompt

> Use this prompt to build the Chrome Extension in a **separate repository** (`VukixxExtension`).
> It captures prompts from ChatGPT, Claude, and Midjourney and saves them into the Vukixxx desktop app.

---

## 🎯 Project Goal

Build a Chrome Extension called **VukixxExtension** that adds a "Save to Vukixxx" button on ChatGPT, Claude, and Midjourney web pages. When clicked, it captures the current prompt text, sends it to the Vukixxx desktop app via Native Messaging, where AI auto-classifies it (title, category, tags) and saves it as a `.md` file.

---

## 📁 Tech Stack

- **Manifest V3** (Chrome Extension)
- **TypeScript** + **Vite** for build
- **Content Scripts** for ChatGPT, Claude, Midjourney DOM injection
- **Popup UI** — minimal, Apple HIG-inspired design (matches Vukixxx desktop style)
- **Native Messaging** — communicates with Vukixxx desktop app
- **Chrome Storage API** — for settings persistence

---

## 🏗️ Architecture

```
VukixxExtension/
├── manifest.json              # Manifest V3
├── vite.config.ts             # Build config
├── package.json
├── tsconfig.json
├── src/
│   ├── background/
│   │   └── service-worker.ts  # Background service worker
│   ├── content/
│   │   ├── chatgpt.ts         # Content script for ChatGPT
│   │   ├── claude.ts          # Content script for Claude.ai
│   │   ├── midjourney.ts      # Content script for Midjourney
│   │   └── inject-button.ts   # Shared button injection logic
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.tsx          # React popup UI
│   │   └── popup.css
│   ├── shared/
│   │   ├── types.ts           # Shared TypeScript types
│   │   ├── messaging.ts       # Chrome messaging helpers
│   │   └── storage.ts         # Chrome storage helpers
│   └── assets/
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
├── native-host/
│   ├── com.vukixxx.extension.json   # Native messaging host manifest
│   └── README.md                     # Setup instructions
└── README.md
```

---

## 📋 manifest.json

```json
{
  "manifest_version": 3,
  "name": "VukixxExtension",
  "version": "1.0.0",
  "description": "Save prompts from ChatGPT, Claude, and Midjourney to Vukixxx",
  "permissions": [
    "activeTab",
    "storage",
    "nativeMessaging"
  ],
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://www.midjourney.com/*"
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

## 🔌 Content Scripts — How They Work

### ChatGPT (`chatgpt.ts`)

1. **Observe DOM** for the prompt input container (`#prompt-textarea` or similar)
2. **Inject** a small "Save to Vukixxx" button next to the send button
3. On click → read the textarea value → send to background service worker
4. Also detect sent messages in the conversation thread and add "Save" buttons on each user message bubble

### Claude (`claude.ts`)

1. **Observe DOM** for Claude's contenteditable prompt area
2. **Inject** "Save to Vukixxx" button
3. Same flow: capture → send → save

### Midjourney (`midjourney.ts`)

1. **Observe DOM** for prompt input
2. Inject button, capture prompt text on click

### Shared Button (`inject-button.ts`)

```typescript
export function createSaveButton(onSave: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'vukixx-save-btn';
  btn.innerHTML = `<svg>...</svg> Save to Vukixxx`;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSave();
    // Show success animation
    btn.classList.add('vukixx-saved');
    setTimeout(() => btn.classList.remove('vukixx-saved'), 1500);
  });
  return btn;
}
```

---

## 🔗 Communication Protocol

### Content Script → Background Service Worker

```typescript
// Message types
interface SavePromptMessage {
  type: 'SAVE_PROMPT';
  payload: {
    text: string;
    source: 'chatgpt' | 'claude' | 'midjourney';
    url: string;
    timestamp: string;
  };
}

interface SavePromptResponse {
  success: boolean;
  promptId?: string;
  title?: string;
  error?: string;
}
```

### Background → Native Messaging (to Vukixxx Desktop)

```typescript
// Native messaging port
const port = chrome.runtime.connectNative('com.vukixxx.extension');

port.postMessage({
  action: 'save_prompt',
  text: promptText,
  source: 'chatgpt',
  url: tabUrl,
});

port.onMessage.addListener((response) => {
  // { success: true, promptId: 'xxx', title: 'Generated Title' }
});
```

---

## 🖥️ Native Messaging Host (in Vukixxx Desktop)

The Vukixxx Tauri app needs a **native messaging host** to receive prompts from the extension:

### Registration (Windows)

```json
// com.vukixxx.extension.json
{
  "name": "com.vukixxx.extension",
  "description": "Vukixxx Native Messaging Host",
  "path": "C:\\Program Files\\Vukixxx\\vukixxx-native-host.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://EXTENSION_ID_HERE/"
  ]
}
```

Registry key: `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.vukixxx.extension`

### What the host does:

1. Receives JSON from stdin (Chrome's native messaging protocol)
2. Parses the prompt text
3. Calls the AI classification (using Gemini/Ollama via the same API)
4. Generates title, category, tags
5. Writes `.md` file to the prompts directory
6. Returns success response via stdout

---

## 🎨 Popup UI Design

Match the Vukixxx desktop widget design:

- **White glassmorphism** background
- **Apple HIG** typography (SF Pro / system font)
- Show recent saves (last 5)
- Settings: prompts folder path, AI provider toggle
- Status indicator: connected/disconnected to Vukixxx desktop
- "Open Vukixxx" button

---

## 📝 Prompt Format (same as Vukixxx desktop)

```markdown
---
id: chatgpt-prompt-1709xyz
label: "AI Generated Title Here"
category: backend
tags: [api, nodejs, rest]
created: 2026-03-05T21:00:00Z
updated: 2026-03-05T21:00:00Z
source: chatgpt
sourceUrl: https://chatgpt.com/c/xxx
---

The actual prompt content goes here...
```

---

## 🚀 Implementation Steps

1. **Init project**: `npm create vite@latest . -- --template react-ts`
2. **Setup manifest.json** with all permissions and content scripts
3. **Build content scripts** — detect each platform's DOM, inject buttons
4. **Build popup UI** — React, minimal Apple-style design
5. **Implement background service worker** — handle messages, native messaging
6. **Build native host binary** (Rust, small stdin/stdout bridge) — or use Tauri's existing commands
7. **Add to Vukixxx desktop**: Windows registry entry for native messaging host, installer update
8. **Test** on all 3 platforms (ChatGPT, Claude, Midjourney)
9. **Publish** to Chrome Web Store

---

## ⚠️ Important Notes

- The native messaging host binary should auto-install when Vukixxx desktop is installed
- The extension should work in "fallback mode" without native messaging — saving prompts to `chrome.storage.local` for later sync
- All styles should use `vukixx-` prefix to avoid CSS collisions with host pages
- Content scripts should use `MutationObserver` to handle SPA navigation on ChatGPT/Claude
- Midjourney may require special handling due to Discord-like architecture
