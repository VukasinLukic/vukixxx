# Vukixxx - Quick Reference

## 🎯 3-Minute Setup

### 1. Install & Launch
- Run `Vukixxx-Setup.exe`
- Desktop shortcut created automatically
- Launch from desktop icon

### 2. Configure Gemini (Optional - for Auto-Classify)
```
1. Visit: https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy key
4. In Vukixxx: Settings → AI Provider → Gemini
5. Paste key → Test Connection → Save
```

### 3. Create First Prompt
```
1. Prompts tab → New Prompt
2. Label: "My First Prompt"
3. Content: Your prompt text
4. Click "Auto" for AI category (if configured)
5. Save
```

### 4. Use Widget
```
1. Press Ctrl+Shift+V (anywhere on Windows)
2. Click prompt → Auto-copies as TOON
3. Paste in ChatGPT/Claude → 60% token savings!
```

---

## ⚡ Common Workflows

### Workflow 1: Daily Developer Prompts
```
Morning:
1. Ctrl+Shift+V → Open widget
2. Select "Backend API Template"
3. Click → Copies as TOON
4. Paste in ChatGPT
5. AI generates API code with 60% less tokens
```

### Workflow 2: Marketing Campaign
```
1. Create pack: "Campaign Q1"
2. Add prompts:
   - "SEO Meta Tags"
   - "Email Subject Lines"
   - "Social Posts"
3. Multi-select all (checkboxes)
4. Export → Copy as TOON
5. Paste in AI → Batch generate content
```

### Workflow 3: Component Library
```
1. Create "Master Design Prompt"
2. Add child prompts:
   - "Button Component"
   - "Input Component"
   - "Card Component"
3. Each inherits master guidelines
4. Ctrl+Shift+V → Select component → Paste
5. Consistent components every time
```

---

## 🎹 All Shortcuts

| Action | Shortcut | Where |
|--------|----------|-------|
| Toggle Widget | `Ctrl+Shift+V` | Global (anywhere) |
| Open Help | `F1` | In app |
| Save Prompt | `Ctrl+S` | Prompt editor |
| Close Modal | `Esc` | Any modal |
| Search Prompts | Type in widget | Widget |
| Multi-Select | Click checkboxes | Widget |
| Preview Prompt | Eye icon | Widget |

---

## 📁 File Locations

### Prompts Directory
```
C:\Users\<YourName>\.vukixxx\prompts\
```

### Settings File
```
C:\Users\<YourName>\.vukixxx\settings.json
```

### Log Files
```
C:\Users\<YourName>\AppData\Local\com.vukixxx.app\logs\
```

---

## 🔧 Quick Fixes

### Problem: Widget shows "No prompts yet"
**Fix**:
1. Check if `.vukixxx\prompts\` folder exists
2. Create a prompt in main app first
3. Restart app (Ctrl+Q → Relaunch)

### Problem: Auto-classify button disabled
**Fix**:
1. Settings → AI Provider
2. Configure Gemini or other provider
3. Test Connection → Should show "✓ Available"
4. Try Auto-classify again

### Problem: Ctrl+Shift+V doesn't work
**Fix**:
1. Check if another app uses this shortcut
2. Restart Vukixxx
3. Try running as Administrator (right-click icon → Run as Admin)

### Problem: Prompts not saving
**Fix**:
1. Check disk space (need ~10MB free)
2. Check folder permissions: `C:\Users\<Name>\.vukixxx\`
3. Restart app

---

## 💰 Cost Calculator (Gemini)

### Free Tier (Gemini 2.0 Flash)
- **Limit**: 15 requests/min, 1500/day
- **Cost**: $0 (FREE!)

### Example Usage:
```
Daily workflow:
- 10 prompt classifications: 10 requests
- 5 pack exports: 0 requests (local)
- 20 widget copies: 0 requests (local)

Total: 10/1500 daily limit = 99.3% remaining ✅
```

### Token Savings (TOON Format):
```
Original Markdown: 1000 tokens @ $0.001/1k = $0.001
TOON Format:       400 tokens  @ $0.001/1k = $0.0004

Savings per prompt: $0.0006 (60%)

100 prompts/month: Save $0.06
1000 prompts/month: Save $0.60
10000 prompts/month: Save $6.00
```

---

## 🎁 TOON Format Cheat Sheet

### When to Use TOON:
✅ Sending to LLM (ChatGPT, Claude, Gemini)
✅ API calls (save $$$ on tokens)
✅ Batch processing
✅ Database storage

### When to Use Markdown:
✅ Reading/editing prompts
✅ Git version control
✅ Documentation
✅ Sharing with humans

### Conversion Example:

**Markdown (150 tokens)**:
```markdown
# Create React Component

Build a reusable Button component.

**Props:**
- variant: primary | secondary
- size: sm | md | lg
- onClick: handler function

**Style:** Tailwind CSS
```

**TOON (60 tokens)**:
```
prompts[0]{Create React Component,design,Build a reusable Button component. Props: variant (primary|secondary), size (sm|md|lg), onClick (handler). Style: Tailwind CSS}:
```

---

## 📞 Get Help

**In-App**: Press `F1` for full help documentation

**Online**:
- GitHub Issues: https://github.com/vukixxx/vukixxx/issues
- Documentation: https://vukixxx.dev/docs

**Local Guides**:
- Full Guide (Serbian): `KORISNICKO-UPUTSTVO.md`
- README: `README.md`
- This file: `QUICK-REFERENCE.md`

---

**Made with ❤️ by Vukixxx Team**
