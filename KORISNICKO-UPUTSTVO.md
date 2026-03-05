# Vukixxx - Korisnički Vodič

## 🚀 Šta je Vukixxx?

Vukixxx je AI Context Workbench - alat za upravljanje promptovima koji koristi **TOON format** za **60% uštedu tokena** pri radu sa AI modelima.

---

## 📋 Brzi Start

### 1️⃣ Prva Pokretanja

Kada pokreneš aplikaciju:
- **Main Window** - Glavni prozor za upravljanje promptovima
- **Widget** - Pritiski `Ctrl+Shift+V` za brzi pristup promptovima (always-on-top)
- **System Tray** - Ikonica u tray-u za brzi pristup

### 2️⃣ Konfiguriši AI Provider (Gemini - PREPORUČENO)

#### Zašto Gemini?
- ✅ **BESPLATAN** - 15 zahteva/minut, 1500/dan
- ✅ **Brz** - Odlična performansa
- ✅ **Kvalitetan** - Gemini 2.0 Flash je odličan za klasifikaciju

#### Kako dobiti Gemini API ključ:

1. **Idi na**: https://aistudio.google.com/apikey
2. Klikni **"Get API Key"** ili **"Create API Key"**
3. Izaberi projekat ili kreiraj novi
4. **Kopiraj API ključ** (čuva se na sigurnom mestu!)

#### Konfiguriši u Vukixxx:

1. Otvori aplikaciju
2. Klikni na **Settings** (tab sa desne strane)
3. U **AI Provider** sekciji:
   - Izaberi **Google Gemini**
   - Zalepi API ključ
   - Model: `gemini-2.0-flash-exp` (najbolji za klasifikaciju)
   - Klikni **Test Connection** da proveriš
4. **Sačuvaj**

✅ **Sada možeš da koristiš Auto-classify!**

---

## 💡 Kako Koristiti Aplikaciju

### 📝 Kreiranje Prompta

1. Klikni **Prompts** tab
2. Klikni **New Prompt** u Browser panelu
3. Popuni:
   - **Label**: Naziv prompta (npr. "Backend API Design")
   - **ID**: Auto-generisan (npr. "backend-api-design")
   - **Category**: Backend, Design, Marketing, Core, Other
   - **Content**: Sadržaj prompta (podržava Markdown)

#### 🤖 Auto-Classify (AI automatska kategorizacija)

- Dok unosiš sadržaj, klikni **Auto** dugme pored Category
- AI će automatski predložiti kategoriju na osnovu sadržaja
- Proveri konzolu (F12) za predložene tagove i confidence score

### 📦 Memory Packs (Kolekcije Prompta)

1. Klikni **Packs** tab
2. Klikni **New Pack**
3. Dodaj promptove u pack
4. **Export as TOON** - Kopiraj za AI (60% manje tokena!)
5. **Export as Markdown** - Čitljiv format za ljude

### 🎯 Widget - Brzi Pristup

Pritiski **Ctrl+Shift+V** bilo gde na Windows-u:
- ✅ Widget se otvara iznad svih prozora
- ✅ Klikni na prompt → Automatski se kopira kao TOON
- ✅ Checkboxes → Multi-select za batch export
- ✅ Eye ikonica → Preview prompta
- ✅ Search → Pretraži promptove

**Export Opcije:**
- **Copy as TOON** - Clipboard (paste u ChatGPT/Claude)
- **Download TOON** - Fajl (.toon)
- **Download Markdown** - Fajl (.md)
- **Download JSON** - Fajl (.json)

---

## 🎯 Use Case Scenariji

### Scenario 1: Developeri - Backend API Projekti

**Problem**: Moraš da pišeš API endpoint za user authentication svaki put.

**Rešenje sa Vukixxx**:
1. Kreiraj prompt: "Backend API - User Auth"
2. Sadržaj:
   ```
   Create a secure user authentication API endpoint with:
   - JWT token generation
   - Password hashing (bcrypt)
   - Email validation
   - Rate limiting
   - Error handling
   ```
3. Sačuvaj u pack: "Backend Starters"
4. Kada počneš novi projekat: `Ctrl+Shift+V` → Klikni "User Auth" → Paste u ChatGPT

**Ušteda**: 60% tokena + instant pristup!

---

### Scenario 2: Marketari - SEO Optimizacija

**Problem**: Trebaš različite SEO promptove za blog, landing page, product description.

**Rešenje sa Vukixxx**:
1. Kreiraj pack: "SEO Toolkit"
2. Dodaj promptove:
   - "Blog SEO Optimizer"
   - "Landing Page Meta Tags"
   - "Product Description SEO"
   - "Keyword Research Prompt"
3. Multi-select sve (checkbox u widgetu)
4. **Export → Copy as TOON** → Paste u AI tool

**Ušteda**: 60% tokena + konzistentan SEO pristup!

---

### Scenario 3: UI/UX Designeri - Component Library

**Problem**: Trebaš konzistentne React komponente sa istim stilom.

**Rešenje sa Vukixxx**:
1. Kreiraj "Master Design Prompt" sa:
   - Color palette
   - Typography scale
   - Spacing system
   - Component guidelines
2. Kreiraj child promptove:
   - "Button Component"
   - "Form Input Component"
   - "Card Component"
3. Svaki child prompt nasledjuje Master guidelines
4. `Ctrl+Shift+V` → Klikni component → AI generiše konzistentno

**Ušteda**: 60% tokena + konzistentnost dizajna!

---

### Scenario 4: Tech Writeri - Dokumentacija

**Problem**: Pišeš 10 API endpoint dokumentacija sa istom strukturom.

**Rešenje sa Vukixxx**:
1. Kreiraj "API Doc Template" prompt
2. Exportuj kao TOON
3. Za svaki endpoint: Paste TOON + ime endpoint-a u AI
4. AI generiše konzistentnu dokumentaciju

**Ušteda**: 60% tokena + instant dokumentacija!

---

## 🔧 Napredne Funkcije

### 1. Parent-Child Hijerarhija

- **Master Prompt** - Osnovni kontekst (npr. "React Best Practices")
- **Child Prompts** - Nasledjuju master (npr. "Login Component", "Dashboard")

### 2. 3D Knowledge Graph

- Vizualizacija prompt hijerarhije
- Klikni node → Otvori prompt
- Rotacija: Drag miš
- Zoom: Scroll

### 3. File Watcher (Auto-Reload)

- Edituj `.md` fajlove eksterno (VS Code)
- Vukixxx automatski detektuje izmene
- Prompts se refresh-uju

### 4. Tags (Budućnost - Currently Logged)

- AI predlaže tagove tokom klasifikacije
- Proveri konzolu (F12) → `Classification result`

---

## ⌨️ Prečice

| Prečica | Akcija |
|---------|--------|
| **Ctrl+Shift+V** | Toggle Widget (globalno) |
| **F1** | Otvori Help Modal |
| **Ctrl+S** | Sačuvaj prompt (u editoru) |
| **Esc** | Zatvori modale |

---

## 📂 Gde su Promptovi?

**Desktop (Tauri)**:
```
C:\Users\<tvoje-ime>\.vukixxx\prompts\
```

**Browser (Fallback)**:
```
IndexedDB (browser storage)
```

Svaki prompt je `.md` fajl sa frontmatter-om:
```markdown
---
id: backend-api
label: Backend API
category: backend
parent: master
---

Sadržaj prompta ovde...
```

---

## 🎁 TOON Format - Šta to je?

**TOON** = Token-Optimized Object Notation

### Primer konverzije:

**Pre (Markdown - 150 tokena)**:
```markdown
# Backend API Design

Create a REST API for user management.

**Requirements:**
- User CRUD operations
- JWT authentication
- Rate limiting
```

**Posle (TOON - 60 tokena)**:
```
prompts[0]{Backend API,backend,Create a REST API for user management. Requirements: User CRUD operations, JWT authentication, Rate limiting}:
```

### Kada koristiti TOON?

✅ **Koristi TOON kada**:
- Slanje promptova u LLM (ChatGPT, Claude, Gemini)
- Čuvaš promptove u bazi
- Batch processing
- API call-ovi (manje $$$)

❌ **Koristi Markdown kada**:
- Čitaš/edituj prompts
- Git version control
- Dokumentacija
- Deljenje sa ljudima

---

## 🔄 Import/Export Packs

### Export Pack:
1. Otvori pack
2. Klikni **Export**
3. Čuva se kao `.vukixxx-pack.json`

### Import Pack:
1. Packs tab → **Import**
2. Izaberi `.vukixxx-pack.json` fajl
3. Prompts + Pack se automatski dodaju

**Share with team**: Pošalji `.vukixxx-pack.json` fajl!

---

## 🐛 Troubleshooting

### Widget ne prikazuje promptove?

1. Proveri `C:\Users\<ime>\.vukixxx\prompts\` da li postoje .md fajlovi
2. Restart aplikacije
3. Proveri konzolu (F12) za greške

### Auto-classify ne radi?

1. Settings → AI Provider → Test Connection
2. Proveri API key (Gemini)
3. Proveri internet konekciju

### Global shortcut ne radi?

1. Proveri da li druga app koristi Ctrl+Shift+V
2. Restart aplikacije
3. Pokreni kao Administrator (rijetko potrebno)

---

## 💰 Troškovi (Gemini API)

**Gemini 2.0 Flash**:
- ✅ **FREE tier**: 15 zahteva/minut, 1500/dan
- ✅ **Classify prompt**: ~1 zahtev = 200 tokena input + 50 output
- ✅ **1500 klasifikacija/dan BESPLATNO!**

**Primer**:
- Ako klasifikuješ 10 prompta dnevno = **100% besplatno**
- Ako export-uješ 100 prompta sa 60% uštede = **Saves $$$**

---

## 🎉 Gotovo!

Sada znaš kako da koristiš Vukixxx!

**Sledeći koraci**:
1. Konfiguriši Gemini API (5 min)
2. Kreiraj prvi prompt
3. Probaj Auto-classify
4. Exportuj kao TOON
5. Paste u ChatGPT/Claude i vidi uštedu!

---

## 🆘 Podrška

- **GitHub Issues**: https://github.com/vukixxx/vukixxx/issues
- **Documentation**: https://vukixxx.dev/docs
- **Discord**: Coming soon

**Made with ❤️ by Vukixxx Team**
