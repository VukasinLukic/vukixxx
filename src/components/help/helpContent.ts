export interface HelpSection {
  title: string;
  content: string;
}

export const helpSections: Record<string, HelpSection> = {
  gettingStarted: {
    title: "Getting Started",
    content: `
## Welcome to Vukixxx

Vukixxx is an AI Context Workbench that helps you manage prompts efficiently using the TOON format for 60% token savings.

### Quick Start

1. **Create Your First Prompt**
   - Click the Prompts tab in the Dock
   - Click "New Prompt" in the browser panel
   - Write your prompt content and save

2. **Organize into Memory Packs**
   - Navigate to the Packs tab
   - Click "New" to create a pack
   - Add prompts to your pack

3. **Export as TOON Format**
   - Open a pack
   - Click "Export" to save as TOON
   - Enjoy 60% smaller file size for API calls

### TOON Format Benefits

TOON (Token-Optimized Object Notation) compresses prompts by:
- Removing markdown formatting
- Using compact syntax
- Batch encoding multiple prompts
- Preserving all semantic content
    `
  },

  features: {
    title: "Features",
    content: `
## Core Features

### 📝 Prompt Management
- Create, edit, and delete prompts
- Organize with categories and tags
- Fuzzy search across all prompts
- Parent-child prompt relationships
- Markdown editor with preview

### 📦 Memory Packs
- Group prompts into reusable packs
- Assign system roles to packs
- Export as TOON or Markdown
- Import/Export packs as JSON
- Token usage statistics

### 🎯 3D Knowledge Graph
- Visualize prompt relationships
- Navigate hierarchy in 3D space
- Click nodes to open prompts
- Add prompts directly from graph

### ⚡ Widget
- Always-on-top quick access
- Copy prompts with one click
- Multi-select for batch operations
- Search and filter prompts
- Global shortcut: **Ctrl+Shift+V**

### 🤖 AI Integration
- Ollama (local, free)
- Google Gemini (API key required)
- Anthropic Claude (API key required)
- Auto-classification (coming soon)
- Smart suggestions (coming soon)

### 💾 Storage
- Desktop: File system storage
- Browser: IndexedDB fallback
- Auto-save on every change
- File watcher for external edits
    `
  },

  shortcuts: {
    title: "Keyboard Shortcuts",
    content: `
## Keyboard Shortcuts

### Global Shortcuts
(Work even when app is in background)

| Shortcut | Action |
|----------|--------|
| **Ctrl+Shift+V** | Toggle Widget |
| **F1** | Open Help |

### In-App Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+S** | Save prompt (in editor) |
| **Esc** | Close modals/panels |

### Widget Shortcuts

- **Click** prompt → Copy as TOON
- **Checkbox** → Select multiple
- **Eye icon** → Preview prompt
- **Search** → Filter prompts

### Tips

- Use **Ctrl+Shift+V** from any app to quickly access your prompts
- Press **F1** anytime to see this help guide
- Widget stays on top of other windows for easy access
    `
  },

  toonFormat: {
    title: "TOON Format Guide",
    content: `
## Understanding TOON Format

TOON (Token-Optimized Object Notation) is a compact format for AI prompts that saves ~60% tokens compared to Markdown.

### Why TOON?

**Problem:** Markdown prompts waste tokens on formatting
**Solution:** TOON strips formatting, keeps content

### Example Conversion

**Before (Markdown - 150 tokens):**
\`\`\`markdown
# Backend API Design

Create a REST API for user management.

**Requirements:**
- User CRUD operations
- Authentication with JWT
- Rate limiting
\`\`\`

**After (TOON - 60 tokens):**
\`\`\`
prompts[0]{Backend API,backend,Create a REST API for user management. Requirements: User CRUD operations, Authentication with JWT, Rate limiting}:
\`\`\`

### When to Use TOON

✅ **Use TOON when:**
- Sending prompts to LLMs (saves API costs)
- Batch processing multiple prompts
- Storing prompts in databases
- Sharing prompt collections

❌ **Use Markdown when:**
- Reading/editing prompts yourself
- Documenting prompts
- Version control in Git
- Sharing with non-technical users

### Batch Export

Export entire packs in one TOON block:
\`\`\`
prompts[0]{title,category,content}:
prompts[1]{title,category,content}:
prompts[2]{title,category,content}:
\`\`\`

LLMs understand this format natively!
    `
  },

  faq: {
    title: "FAQ",
    content: `
## Frequently Asked Questions

### General

**Q: Is Vukixxx free?**
A: Yes, Vukixxx is open source and free to use.

**Q: Does it require internet?**
A: No for basic use. Internet only needed for AI features (Gemini, Claude).

**Q: Where are my prompts stored?**
A: Desktop: \`~/.vukixxx/prompts/\` | Browser: IndexedDB

### TOON Format

**Q: Do LLMs understand TOON format?**
A: Yes! All major LLMs (GPT, Claude, Gemini) can parse TOON natively.

**Q: How much can I save?**
A: Average 60% token reduction vs Markdown. Savings vary by prompt complexity.

**Q: Can I convert back to Markdown?**
A: Yes, export as Markdown from any pack.

### AI Features

**Q: Which AI provider should I use?**
A: **Ollama** (free, local), **Gemini** (free tier), or **Claude** (paid, best quality)

**Q: Do I need API keys?**
A: Only for Gemini and Claude. Ollama runs locally without keys.

**Q: How do I test my connection?**
A: Go to Settings → AI Provider → Click "Test Connection"

### Memory Packs

**Q: What are Memory Packs?**
A: Collections of related prompts you can export together.

**Q: Can I share packs?**
A: Yes! Export pack → Send .vukixxx-pack.json file → Recipient imports

**Q: How many prompts per pack?**
A: No limit, but 5-20 prompts per pack is recommended for organization.

### Troubleshooting

**Q: Widget not showing prompts?**
A: Check if prompts exist in Settings. Try restarting the app.

**Q: Global shortcut not working?**
A: Check if another app uses Ctrl+Shift+V. You can customize shortcuts in Settings.

**Q: Lost my prompts?**
A: Check \`~/.vukixxx/prompts/\` folder. Files are never deleted without confirmation.
    `
  },

  credits: {
    title: "About & Credits",
    content: `
## About Vukixxx

Vukixxx AI Workbench - Efficient prompt management with TOON format compression.

**Version:** 1.0.0
**License:** MIT
**GitHub:** [github.com/vukixxx/vukixxx](https://github.com/vukixxx/vukixxx)

### Built With

- **Tauri** - Desktop app framework
- **React** - UI library
- **Three.js** - 3D graph visualization
- **Zustand** - State management
- **Rust** - Backend runtime

### Credits

Developed with ❤️ by the Vukixxx team.

Special thanks to:
- Anthropic for Claude API
- Google for Gemini API
- Ollama for local LLM runtime
- The open source community

### Support

- **Report Issues:** GitHub Issues
- **Documentation:** [vukixxx.dev/docs](https://vukixxx.dev/docs)
- **Community:** Discord server

### Contributing

Vukixxx is open source! Contributions welcome:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

See CONTRIBUTING.md for guidelines.
    `
  }
};

export const helpSectionKeys = Object.keys(helpSections) as Array<keyof typeof helpSections>;
