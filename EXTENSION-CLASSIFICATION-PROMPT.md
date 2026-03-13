# VukixxExtension — Claude Bot Instructions

> **Prompt for Claude bot** working on the VukixxExtension Chrome Extension project.
> Copy-paste this into Claude to fix the extension's Firebase save logic.

---

## Task

Modify the VukixxExtension Chrome Extension so that when saving prompts to Firebase, it does **NOT** do any AI classification. The Vukixxx desktop app handles classification.

## What to change

### 1. When saving a prompt to Firebase Firestore, use this exact schema:

```typescript
interface FirebasePromptDocument {
  text: string;            // The actual prompt content captured from ChatGPT/Claude/Midjourney
  title: string;           // "" (empty string — desktop app will generate via AI)
  category: "other";       // Always "other" — desktop app will classify via AI
  tags: [];                // Always empty — desktop app will generate via AI
  source: "chatgpt" | "claude" | "midjourney";  // Which platform it was captured from
  sourceUrl: string;       // Current page URL
  classified: false;       // 🚩 CRITICAL FLAG — must be false! Desktop app checks this
  confidence: 0;           // No confidence yet
  created: Timestamp;      // Firebase server timestamp
  updated: Timestamp;      // Firebase server timestamp
}
```

### 2. Remove any AI classification logic from the extension

- No API key handling for Gemini/Claude/Ollama in the extension
- No title generation in the extension
- No category guessing — always save as `"other"`
- No tag generation — always save empty `[]`

### 3. The `classified: false` flag is CRITICAL

The Vukixxx desktop app watches Firebase for new prompts. When it sees `classified: false`, it:
1. Runs AI classification (Gemini/Claude/Ollama) to determine category + tags
2. Generates a title using AI
3. Writes results back to Firebase with `classified: true`
4. Saves locally as `.md` file with correct metadata

**If `classified` is missing or true, the desktop app will skip AI classification.**

### 4. Example: saving a captured prompt

```typescript
import { collection, addDoc, Timestamp } from 'firebase/firestore';

async function savePromptToFirebase(text: string, source: string, sourceUrl: string) {
  const db = getFirestoreDb();
  const promptsRef = collection(db, 'prompts');
  
  await addDoc(promptsRef, {
    text,
    title: '',
    category: 'other',
    tags: [],
    source,
    sourceUrl,
    classified: false,    // Desktop app will classify this
    confidence: 0,
    created: Timestamp.now(),
    updated: Timestamp.now(),
  });
}
```

### 5. Firestore Security Rules

Make sure Firestore rules allow updates (desktop app needs to write classification back):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /prompts/{promptId} {
      allow create: if true;   // Extension writes new prompts
      allow read: if true;     // Desktop reads prompts
      allow update: if true;   // Desktop writes classification back
      allow delete: if false;  // No deletes
    }
  }
}
```

## Summary

**Extension = dumb capture tool.** Just grab the text, throw it into Firebase with `classified: false`. Done.  
**Desktop app = smart classifier.** It does all the AI work when it pulls the prompt for the first time.
