# Vukixxx - AI Context Workbench

> Manage AI prompts efficiently with **60% token savings** using TOON format

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)

---

## 🚀 Quick Start

### Installation

1. Download `Vukixxx-Setup.exe` from Releases
2. Run installer (creates desktop shortcut automatically)
3. Launch Vukixxx from desktop or Start menu

### First Steps

1. **Configure AI Provider** (Optional but recommended):
   - Settings → AI Provider → Select **Google Gemini**
   - Get free API key: https://aistudio.google.com/apikey
   - Paste key → Test Connection → Save

2. **Create Your First Prompt**:
   - Prompts tab → New Prompt
   - Enter content → Click **Auto** for AI classification
   - Save

3. **Use the Widget**:
   - Press `Ctrl+Shift+V` anywhere on Windows
   - Click prompt → Auto-copies as TOON format
   - Paste in ChatGPT/Claude/Gemini → **60% token savings!**

---

## ✨ Key Features

- 📝 **Prompt Management** - Create, edit, organize prompts with categories
- 📦 **Memory Packs** - Group related prompts for batch export
- 🤖 **AI Auto-Classify** - Auto-suggest categories and tags (requires API key)
- 🎯 **Widget** - Always-on-top quick access (`Ctrl+Shift+V`)
- 🔄 **TOON Format** - 60% token savings vs Markdown
- 🌐 **3D Knowledge Graph** - Visualize prompt hierarchy
- ⚡ **Global Shortcuts** - Access prompts from anywhere
- 💾 **Auto-Save** - File watcher for external edits

---

## 🎯 Use Cases

### For Developers
- Backend API templates
- React component starters
- Database query patterns
- Error handling templates

### For Marketers
- SEO optimization prompts
- Landing page copy templates
- Email campaign starters
- Social media post formats

### For Designers
- Component design systems
- Hero section templates
- Color palette guidelines
- Typography scales

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+V` | Toggle Widget (global) |
| `F1` | Open Help |
| `Ctrl+S` | Save prompt (in editor) |
| `Esc` | Close modals |

---

## 🔧 Configuration

### Gemini API (Recommended - FREE)

1. Get API key: https://aistudio.google.com/apikey
2. Settings → AI Provider → Google Gemini
3. Paste key → Test → Save

**Limits**: 15 requests/min, 1500/day (FREE tier)

### Other Providers

- **Ollama** (Local, free) - No API key needed
- **Claude** (Paid) - Get key from https://console.anthropic.com

---

## 📂 File Structure

Prompts are stored as Markdown files:

```
C:\Users\<username>\.vukixxx\prompts\
├── backend-api.md
├── design-component.md
├── marketing-seo.md
└── master.md
```

Each file:
```markdown
---
id: backend-api
label: Backend API
category: backend
parent: master
---

Your prompt content here...
```

---

## 🎁 TOON Format Example

**Markdown (150 tokens)**:
```markdown
# Backend API

Create REST API for users.

**Requirements:**
- CRUD operations
- JWT auth
- Rate limiting
```

**TOON (60 tokens - 60% savings!)**:
```
prompts[0]{Backend API,backend,Create REST API for users. Requirements: CRUD operations, JWT auth, Rate limiting}:
```

---

## 🏗️ Building from Source

```bash
# Clone repository
git clone https://github.com/vukixxx/vukixxx.git
cd vukixxx

# Install dependencies
npm install

# Run in development
npm run tauri dev

# Build for Windows
npm run tauri build
```

**Requirements**:
- Node.js 18+
- Rust (latest stable)
- Windows 10/11

---

## 📦 Project Structure

```
vukixxx/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── stores/            # Zustand state management
│   ├── services/          # AI providers, storage
│   ├── prompts/           # Bundled prompts
│   └── widget/            # Widget entry point
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── commands/      # Tauri commands
│   │   └── lib.rs        # Main entry
│   └── capabilities/      # Security policies
└── dist/                  # Build output
```

---

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🐛 Troubleshooting

### Widget shows "No prompts yet"?
- Check if files exist: `C:\Users\<name>\.vukixxx\prompts\`
- Restart app
- Check console (F12) for errors

### Auto-classify not working?
- Settings → AI Provider → Test Connection
- Check API key validity
- Ensure internet connection

### Global shortcut not working?
- Check if another app uses `Ctrl+Shift+V`
- Restart app
- Run as Administrator (rarely needed)

---

## 📞 Support

- 🐛 **Issues**: https://github.com/vukixxx/vukixxx/issues
- 📚 **Docs**: https://vukixxx.dev/docs
- 💬 **Discord**: Coming soon

---

**Made with ❤️ by the Vukixxx Team**

**Full User Guide (Serbian)**: [KORISNICKO-UPUTSTVO.md](KORISNICKO-UPUTSTVO.md)
