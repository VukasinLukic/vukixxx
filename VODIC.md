# 📖 Vukixxx - Vodič za korišćenje

## 🎯 Šta je Vukixxx?

Vukixxx je AI Context Workbench - alat za organizaciju, upravljanje i export AI promptova u struktuiranom hijerarhijskom sistemu. Omogućava ti da:
- Organizuješ promptove u grafovski prikaz
- Kreiraš "Memory Packs" - kolekcije promptova za različite AI use-case-ove
- Exportuješ u TOON format (60% manji od Markdown-a)
- Vizualizuješ relacije između promptova u 3D grafu

---

## 🚀 Brzi start

### 1. **Memory Graph** (Početni ekran)
- **3D Graf** prikazuje sve promptove i njihove relacije
- **Klik na node** → Otvara prompt u prozoru
- **Reset View** → Vraća kameru na početnu poziciju
- **Add Prompt** → Kreira novi prompt

### 2. **Prompts** (Tab)
- **Browser** → Pretraži i filtriraj promptove
  - Search bar za fuzzy pretragu (Fuse.js)
  - Kategorije: Core, Design, Backend, Marketing, Other
  - Filter panel (ikonica sa slajderima)
- **Klik na prompt** → Otvara PromptViewer
- **New Prompt** → Kreira novi prompt

### 3. **Packs** (Tab)
- **Memory Packs** → Kolekcije promptova za export
- **Kreiranje Pack-a**:
  1. Klikni "New Pack"
  2. Unesi ime i opis
  3. Dodaj System Role (opciono)
  4. Dodaj promptove (drag & drop reorder)
- **Export opcije**:
  - Markdown - klasični format
  - TOON - kompresovani format (60% manji)
  - JSON - strukturirani export

### 4. **Settings** (Tab)
- Podešavanja aplikacije (buduće opcije)

---

## 📝 Kako kreirati prompt?

1. Klikni **"Add Prompt"** ili **"New Prompt"**
2. Popuni formu:
   - **ID**: Jedinstveni identifikator (npr. `design-hero`)
   - **Label**: Prikazno ime (npr. "Hero Design")
   - **Category**: Core, Design, Backend, Marketing, Other
   - **Parent**: Opciono - roditelj prompt (za hijerarhiju)
   - **Tags**: Ključne reči za pretragu
   - **Content**: Markdown sadržaj prompta
3. Klikni **"Create"**

### Primer strukture:

```markdown
---
id: design-hero
label: Hero Design
category: design
parent: master
tags: [design, ui, hero]
---

# Hero Design

Create a stunning hero section with:
- Bold headline
- Compelling CTA
- Eye-catching visuals
```

---

## 🎨 Workflow primeri

### Primer 1: Web dizajn projekat
```
1. Kreiraj "master" root prompt sa opštim kontekstom
2. Dodaj child promptove:
   - design-hero (parent: master)
   - design-component (parent: design-hero)
   - backend-api (parent: master)
3. Kreiraj Memory Pack "Web Design"
4. Dodaj sve design promptove u pack
5. Export kao TOON za AI chat
```

### Primer 2: Marketing kampanja
```
1. Kreiraj System Role "Marketing Expert"
2. Kreiraj promptove:
   - marketing-landing
   - marketing-seo (parent: marketing-landing)
   - marketing-email
3. Kreiraj Pack "Marketing Campaign"
4. Postavi System Role
5. Reorder promptove po prioritetu
6. Export i kopiraj u Claude/ChatGPT
```

---

## 🔥 Napredne funkcije

### TOON Format
- **60% manji** od Markdown-a
- Kompresuje frontmatter
- Optimizovan za AI token usage
- Copy & paste direktno u AI chat

### Fuzzy Search
- Pretraživanje po:
  - Label (2x težina)
  - Content (1x težina)
  - Tags (1x težina)
  - Category (0.5x težina)
- Threshold: 0.35 (balans preciznost/sveobuhvatnost)

### 3D Graf optimizacije
- **LOD (Level of Detail)**:
  - < 100 nodova: Full detail (32 segmenta, 512px teksture)
  - 100-500 nodova: Low detail (16 segmenta, 256px teksture)
  - 500+ nodova: Minimal detail (8 segmenta, samo highlighted labele)
- **GPU cache** za teksture i geometriju
- **Automatic cleanup** na unmount

---

## 💾 Storage

### Browser (default)
- **IndexedDB** (Dexie.js)
- Automatski backup u browser storage
- Perzistentno između sesija

### Tauri (desktop)
- **File system** storage
- `~/vukixxx/prompts/` direktorijum
- Svaki prompt kao .md fajl

---

## ⌨️ Keyboard shortcuts (future)

```
Ctrl/Cmd + N  → New Prompt
Ctrl/Cmd + F  → Focus Search
Ctrl/Cmd + K  → Command Palette
Esc           → Close Modal/Panel
Space         → Quick Actions
```

---

## 🐛 Troubleshooting

### Promptovi se ne učitavaju
1. Check browser console (F12)
2. Proveri da li postoje fajlovi u `src/prompts/*.md`
3. Refresh stranicu (F5)
4. Clear IndexedDB (Application tab → Storage → IndexedDB)

### Graf je prazан
1. Proveri da li ima promptova u store-u
2. Klikni "Reset View"
3. Pričekaj 1-2 sekunde da se graf renderuje

### Beskonačan loop / React error
1. Check console za "Maximum update depth exceeded"
2. Reportuj bug sa detaljima
3. Temporary fix: Refresh stranica

---

## 📚 Resursi

- **GitHub**: [github.com/your-repo/vukixxx](https://github.com)
- **Documentation**: [docs.vukixxx.com](https://docs.vukixxx.com)
- **Discord**: [discord.gg/vukixxx](https://discord.gg)

---

*Made with ❤️ using React, Three.js, Zustand, and Tauri*
