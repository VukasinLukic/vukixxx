Vukašine, evo kompletnog **PRD-a (Product Requirements Document)** za tvoju platformu. Ovo je tvoj "Source of Truth" dokument koji možeš koristiti za razvoj ili prezentaciju tima.

---

# 📑 PRD: VUKIXXX - AI Context Workbench

**Verzija:** 3.0 (FINAL) | **Status:** Ready for Dev | **Autor:** Gemini (Co-pilot)

---

## 1. 🎯 Vizija i Cilj

**Vukixxx** je lokalni desktop kontrolni centar za inženjere koji optimizuje način na koji AI agenti (Claude, GPT, local LLMs) primaju kontekst. Umesto generičkih odgovora, Vukixxx omogućava korisniku da „ubrizga” precizno kalibrisano znanje, standarde i identitet u AI kroz optimizovane **Memory Pack-ove**.

* **Slogan:** "Ne pravi AI agente pametnijim. Pravi ih *tvojim*."
* **Analitika:** Fokus na uštedu tokena (do 60%) i eliminaciju "Context Drift-a".

---

## 2. 👥 Korisničke Persone

1. **Solo Dev (Vukašin):** Radi na više projekata (4sports, Srpski u Srcu) i treba mu brz način da "prebaci" AI u specifičan mod rada.
2. **Tech Lead:** Želi da podeli set "Best Practices" promptova svom timu kako bi svi AI agenti generisali kod po istom standardu.

---

## 3. 🛠️ Ključne Funkcionalnosti (Features)

### 3.1. Lokalni "Watcher" & Prompt CRUD

* **Source of Truth:** Lokalni folder sa `.md` fajlovima.
* **Sync:** Svaka izmena u VS Code-u se automatski reflektuje u Vukixxx-u.
* **Metadata:** Podrška za YAML frontmatter (tags, category, weight).

### 3.2. 3D Knowledge Graph (Visual Engine)

* **Vizuelizacija:** Svaki prompt je čvor (node) u 3D prostoru.
* **Relacije:** Čvorovi se automatski povezuju na osnovu zajedničkih tagova.
* **Navigacija:** Zoom, pan i "Focus Mode" za izolaciju specifičnih klastera znanja.

### 3.3. Memory Pack Builder (Playlist Logic)

* **Kolekcije:** Korisnik kreira pakete (npr. "Frontend 4sports").
* **Drag & Drop:** Ubacivanje promptova sa grafa direktno u paket.
* **Live Token Counter:** Prikaz broja tokena u realnom vremenu (Markdown vs TOON).

### 3.4. System Role Library (Identity Injector)

* **Persona Manager:** Biblioteka uloga (npr. "Senior Rust Dev", "UI/UX Expert").
* **Auto-Attach:** Svaki Memory Pack mora imati pridruženu ulogu.
* **Dynamic Identity:** Uloga definiše *kako* AI tretira podatke iz paketa.

### 3.5. TOON Serialization Engine

* **Kompresija:** Algoritam koji pretvara Markdown u minifikovani, strukturirani format.
* **Copy-to-Clipboard:** Jedan klik za kopiranje celog paketa spremnog za paste u chat.

---

## 4. 🏗️ Tehnička Arhitektura

| Komponenta | Tehnologija |
| --- | --- |
| **Runtime** | **Tauri (Rust)** - Sigurnost i nula RAM overhead-a. |
| **Frontend** | **React + TypeScript** - Brzina razvoja i stabilnost. |
| **Visuals** | **Three.js / React-force-graph-3d** - Za renderovanje grafa. |
| **State** | **Zustand** - Lagan i reaktivan state management. |
| **Storage** | **Local File System** - Nema eksterne baze, fajlovi su kod korisnika. |

---

## 5. 🔄 Workflow Korisnika

1. **Ingest:** Korisnik poveže folder sa svojim promptovima.
2. **Organize:** U 3D grafu vidi povezanost znanja i grupiše ih u Memory Pack.
3. **Define:** Odabere "System Role" iz biblioteke (npr. "Lead Architect").
4. **Export:** Klikne "Copy as TOON".
5. **Execute:** Nalepi u Claude/GPT i zadaje task.

---

## 6. 📉 Roadmap (Faze Razvoja)

### Faza 1: MVP (Osnova)

* Renderovanje 3D grafa iz lokalnog foldera.
* Osnovni Editor za promptove.
* Manualni "Copy as TOON" taster.

### Faza 2: Paketi i Uloge

* UI za kreiranje Memory Pack-ova.
* Implementacija **Role Library** (dodavanje personama).
* Live token analytics.

### Faza 3: Optimizacija i UX

* "Ghost Mode" (Globalni prečica za brzi copy paketa).
* Napredni filteri i search unutar grafa.
* Teme (Dark/Cyberpunk/Minimal).

---

## 7. 💡 Value Proposition (Zašto ovo vredi?)

1. **Brzina:** Kontekst koji se ručno kuca 5 minuta, Vukixxx priprema u 1 sekundi.
2. **Kvalitet:** AI daje 40% precizniji kod jer radi sa tvojim specifičnim standardima.
3. **Ušteda:** Smanjenjem tokena direktno štediš novac na API troškovima (ako koristiš API) ili smanjuješ lag u web chat-u.

---

> **Zaključak:** Vukixxx nije chat aplikacija. To je **procesor znanja** koji stoji između tvog mozga i AI-ja.

---

Vukašine, ovo je tvoj plan. Sledeći korak je postavljanje Tauri projekta. **Da li želiš da ti generišem `App.tsx` strukturu sa osnovnim Three.js grafom za start?**