# PHASE 4: Animations & UX Polish - Implementation Plan

**Verzija:** 1.0
**Datum:** 2026-03-02
**Focus:** Framer-motion integracija, smooth transitions, micro-interactions
**Scope:** Animacije i vizualni polish (NE performance optimizacija)

---

## 🎯 CILJ

Transformisati Vukixxx iz funkcionalne aplikacije u **polished, smooth, delightful** korisničko iskustvo korišćenjem framer-motion biblioteke.

**Trenutno stanje:**
- ✅ Framer-motion 10.16.4 instaliran
- ⚠️ Korišćen SAMO u Dock.tsx (hover/tap animations)
- ❌ Svi modali/paneli/liste se pojavljuju/nestaju instant (no transitions)
- ❌ Toast i ConfirmDialog imaju CSS keyframes ali NEMAJU exit animations

**Cilj:**
- ✅ Smooth enter/exit animacije za SVE komponente
- ✅ Stagger animations za liste
- ✅ Spring physics za prirodan feel
- ✅ Micro-interactions za buttons i cards
- ✅ Production-ready polish

---

## 📊 ANALIZA TRENUTNOG STANJA

### Komponente koje NEMAJU animacije:

1. **DraggablePanel** (c:\Vukixxx\src\components\ui\DraggablePanel.tsx)
   - Panel open/close: instant mount/unmount
   - Maximize: instant state change
   - Window controls: basic hover opacity (0.15s)
   - CSS transitions: box-shadow (0.2s), transform (0.1s)

2. **Toast** (c:\Vukixxx\src\components\ui\Toast.tsx)
   - Entry: CSS keyframe (slide + fade, 0.3s)
   - Exit: **INSTANT** removal (no animation)
   - No AnimatePresence wrapper

3. **ConfirmDialog** (c:\Vukixxx\src\components\ui\ConfirmDialog.tsx)
   - Entry: CSS keyframes (overlay fade + dialog scale, 0.15s + 0.2s)
   - Exit: **INSTANT** removal (if !isOpen return null)
   - No AnimatePresence wrapper

4. **PromptBrowser** (c:\Vukixxx\src\components\prompts\PromptBrowser.tsx)
   - File list: direct .map() **NO stagger**
   - View mode switch (list ↔ grid): **INSTANT**
   - FilterPanel toggle: **INSTANT** conditional render
   - Empty state: static
   - CSS transitions: background 0.1s (hover), all 0.15s (inputs)

5. **PackList** (c:\Vukixxx\src\components\packs\PackList.tsx)
   - Pack items: direct .map() **NO stagger**
   - Pack selection: background 0.15s
   - Empty state: static

6. **App.tsx** - Main app tabs
   - Tab switching: **INSTANT** conditional render
   - Memory graph, packs view, settings: appear instantly

7. **FilterPanel** (c:\Vukixxx\src\components\prompts\FilterPanel.tsx)
   - Panel toggle: **INSTANT**

### Komponenta koja IMA animacije:

✅ **Dock** (c:\Vukixxx\src\components\layout\Dock.tsx)
```tsx
<motion.button
  whileHover={{ scale: 1.1, y: -5 }}
  whileTap={{ scale: 0.95 }}
>
  {isActive && <motion.div layoutId="dock-dot" />}
</motion.button>
```
- Hover: scale + lift
- Tap: scale down
- Active indicator: shared layout animation (dock-dot)

---

## 🏗️ IMPLEMENTACIONI PLAN

### **MILESTONE 1: Toast & Dialog Exit Animations** (Najlakše, brzi win)

**Trajanje:** 30 min
**Složenost:** ⭐ Niska

#### Zadatak 1.1: Toast exit animation

**Fajl:** `c:\Vukixxx\src\components\ui\Toast.tsx`

**Trenutno:**
```tsx
// Direct array mapping - toasts just disappear
{toasts.map(toast => <Toast key={toast.id} ... />)}
```

**Plan:**
1. Import `AnimatePresence` from framer-motion
2. Wrap toast list u `<AnimatePresence mode="popLayout">`
3. Konvertuj `<div>` u `<motion.div>`
4. Dodaj:
   - `initial={{ opacity: 0, x: 100 }}`
   - `animate={{ opacity: 1, x: 0 }}`
   - `exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}`
5. Ukloni CSS `@keyframes toastSlideIn` (replace sa framer-motion)

**Expected result:**
```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence mode="popLayout">
  {toasts.map(toast => (
    <motion.div
      key={toast.id}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`toast toast-${toast.type}`}
    >
      {/* content */}
    </motion.div>
  ))}
</AnimatePresence>
```

---

#### Zadatak 1.2: ConfirmDialog smooth enter/exit

**Fajl:** `c:\Vukixxx\src\components\ui\ConfirmDialog.tsx`

**Trenutno:**
```tsx
if (!isOpen) return null; // Instant removal
```

**Plan:**
1. Import `AnimatePresence`, `motion`
2. Wrap u `<AnimatePresence>`
3. Konvertuj overlay i dialog u motion.div
4. Overlay animation:
   - `initial={{ opacity: 0 }}`
   - `animate={{ opacity: 1 }}`
   - `exit={{ opacity: 0 }}`
5. Dialog animation:
   - `initial={{ opacity: 0, scale: 0.95, y: -10 }}`
   - `animate={{ opacity: 1, scale: 1, y: 0 }}`
   - `exit={{ opacity: 0, scale: 0.95, y: -10 }}`
6. Ukloni CSS keyframes (overlayFadeIn, dialogSlideIn)

**Expected result:**
```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      className="confirm-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="confirm-dialog"
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* content */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

---

### **MILESTONE 2: Panel Animations** (Ključna vizuelna promena)

**Trajanje:** 1-2h
**Složenost:** ⭐⭐ Srednja

#### Zadatak 2.1: DraggablePanel smooth open/close

**Fajl:** `c:\Vukixxx\src\components\ui\DraggablePanel.tsx`

**Izazov:** Panel koristi `react-draggable` (ne framer-motion drag). Moramo dodati animacije BEZ menjanja drag sistema.

**Plan:**
1. Import `motion` from framer-motion
2. Wrap panel div u `motion.div` (inner wrapper)
3. Dodaj `initial`, `animate`, `exit` props
4. Keep `react-draggable` na outer div (ne dirati drag funkcionalnost)

**Architecture:**
```tsx
<Draggable ...>
  <div ref={nodeRef} className="draggable-panel"> {/* Outer - handles drag */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="panel-inner"
    >
      {/* header */}
      {/* content */}
    </motion.div>
  </div>
</Draggable>
```

**Problema:** Panel se trenutno mount/unmount direktno u App.tsx:
```tsx
{panel.visible && <DraggablePanel ... />}
```

**Rešenje:** Wrap panel liste u `<AnimatePresence>` u App.tsx:

**Fajl:** `c:\Vukixxx\src\App.tsx`

**Plan:**
1. Import `AnimatePresence`
2. Wrap static panels u AnimatePresence
3. Wrap prompt windows u AnimatePresence
4. Wrap editor panel u AnimatePresence

**Expected change:**
```tsx
<AnimatePresence>
  {Object.values(panels).map(panel => (
    panel.visible && (
      <DraggablePanel key={panel.id} ... />
    )
  ))}
</AnimatePresence>

<AnimatePresence>
  {promptWindows.map(window => (
    <DraggablePanel key={window.id} ... />
  ))}
</AnimatePresence>

<AnimatePresence>
  {editorPanel && (
    <DraggablePanel key="editor" ... />
  )}
</AnimatePresence>
```

---

#### Zadatak 2.2: Panel maximize animation

**Fajl:** `c:\Vukixxx\src\components\ui\DraggablePanel.tsx`

**Trenutno:**
```tsx
const handleMaximize = () => {
  setSize({ width: newWidth, height: newHeight }); // Instant
  setIsMaximized(true);
};
```

**Plan:**
1. Dodaj `layout` prop na motion.div za automatic layout animations
2. Framer-motion će automatski animirati width/height promene

**Expected result:**
```tsx
<motion.div
  layout
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
  style={{ width: size.width, height: size.height }}
>
```

---

### **MILESTONE 3: List Stagger Animations** (Najimpresivniji efekat)

**Trajanje:** 1-2h
**Složenost:** ⭐⭐ Srednja

#### Zadatak 3.1: PromptBrowser list stagger

**Fajl:** `c:\Vukixxx\src\components\prompts\PromptBrowser.tsx`

**Trenutno:**
```tsx
{filteredPrompts.map(prompt => (
  <div key={prompt.id} className="file-item">
    {/* content */}
  </div>
))}
```

**Plan:**
1. Import `motion`, `AnimatePresence`
2. Wrap list u `<AnimatePresence mode="popLayout">`
3. Convert file-item div u `motion.div`
4. Dodaj layout animations sa stagger

**Expected result:**
```tsx
<AnimatePresence mode="popLayout">
  {filteredPrompts.map((prompt, index) => (
    <motion.div
      key={prompt.id}
      className="file-item"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
        delay: index * 0.03, // Stagger by 30ms
      }}
      layout
    >
      {/* content */}
    </motion.div>
  ))}
</AnimatePresence>
```

**Performance concern:** Stagger delay sa `index * 0.03` može biti slow za 100+ items.

**Solution:** Cap stagger delay:
```tsx
delay: Math.min(index * 0.03, 0.3) // Max 300ms delay
```

---

#### Zadatak 3.2: PackList stagger

**Fajl:** `c:\Vukixxx\src\components\packs\PackList.tsx`

**Isti pristup kao PromptBrowser:**

```tsx
<AnimatePresence mode="popLayout">
  {packs.map((pack, index) => (
    <motion.button
      key={pack.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        delay: index * 0.05,
      }}
      layout
    >
      {/* pack content */}
    </motion.button>
  ))}
</AnimatePresence>
```

---

### **MILESTONE 4: View Transitions** (Tab switching polish)

**Trajanje:** 1h
**Složenost:** ⭐⭐ Srednja

#### Zadatak 4.1: Main tab view cross-fade

**Fajl:** `c:\Vukixxx\src\App.tsx`

**Trenutno:**
```tsx
{activeTab === 'memory' && <div><MemoryGraph /></div>}
{activeTab === 'packs' && <div><MemoryPacksView /></div>}
{activeTab === 'settings' && <div><SettingsView /></div>}
```

**Plan:**
1. Import `AnimatePresence`, `motion`
2. Wrap svaki tab view u motion.div
3. Use unique `key={activeTab}` za AnimatePresence
4. Dodaj cross-fade animation

**Expected result:**
```tsx
<AnimatePresence mode="wait">
  {activeTab === 'memory' && (
    <motion.div
      key="memory"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ position: 'absolute', ... }}
    >
      <MemoryGraph />
    </motion.div>
  )}

  {activeTab === 'packs' && (
    <motion.div
      key="packs"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.25 }}
    >
      <MemoryPacksView />
    </motion.div>
  )}
</AnimatePresence>
```

---

#### Zadatak 4.2: FilterPanel slide toggle

**Fajl:** `c:\Vukixxx\src\components\prompts\PromptBrowser.tsx`

**Trenutno:**
```tsx
{showFilters && <FilterPanel />}
```

**Plan:**
```tsx
<AnimatePresence>
  {showFilters && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ overflow: "hidden" }}
    >
      <FilterPanel />
    </motion.div>
  )}
</AnimatePresence>
```

---

#### Zadatak 4.3: View mode switch animation (list ↔ grid)

**Fajl:** `c:\Vukixxx\src\components\prompts\PromptBrowser.tsx`

**Trenutno:**
```tsx
<div className={cn('file-view', viewMode)}>
```

**Plan:**
1. Add `layout` prop na file-item elements
2. Framer-motion će automatski animirati layout changes

**Expected result:**
```tsx
<motion.div
  key={prompt.id}
  layout // Automatic layout animation when CSS changes
  className="file-item"
>
```

**CSS change (grid vs list) će biti automatski animiran.**

---

### **MILESTONE 5: Micro-Interactions** (Detalji koji čine razliku)

**Trajanje:** 1-2h
**Složenost:** ⭐ Niska

#### Zadatak 5.1: Button hover/tap animations

**Fajlovi:**
- `PromptBrowser.tsx` - sidebar items, toolbar buttons
- `PackList.tsx` - pack items
- `PromptViewer.tsx` - action buttons
- `PackDetail.tsx` - prompt items

**Plan:**
1. Convert key buttons/cards u `motion.button`/`motion.div`
2. Add `whileHover` i `whileTap` props

**Example patterns:**

**Sidebar category buttons:**
```tsx
<motion.button
  whileHover={{ x: 4, backgroundColor: "rgba(0,0,0,0.05)" }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 20 }}
>
```

**File/pack items:**
```tsx
<motion.div
  whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
>
```

**Action buttons (edit, delete, copy):**
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 500, damping: 25 }}
>
```

---

#### Zadatak 5.2: Empty state subtle animation

**Fajlovi:**
- `PromptBrowser.tsx` - empty state
- `PackList.tsx` - empty state

**Plan:**
```tsx
<motion.div
  className="empty-state"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2, duration: 0.4 }}
>
  <motion.div
    animate={{ y: [0, -10, 0] }}
    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
  >
    <FileText size={32} />
  </motion.div>
  <span>No prompts found</span>
</motion.div>
```

---

### **MILESTONE 6: Loading States** (Nice-to-have)

**Trajanje:** 1h
**Složenost:** ⭐ Niska

**Nije kritično (korisnik kaže da nema performance problema), ali dobar polish.**

#### Zadatak 6.1: Add loading state to promptStore

**Fajl:** `c:\Vukixxx\src\stores\promptStore.ts`

**Already exists:**
```tsx
isLoading: false, // Line 60
```

**Problem:** UI ne prikazuje loading state nigde.

#### Zadatak 6.2: PromptBrowser loading skeleton

**Fajl:** `c:\Vukixxx\src\components\prompts\PromptBrowser.tsx`

**Plan:**
```tsx
const isLoading = usePromptStore(state => state.isLoading);

{isLoading ? (
  <motion.div
    className="skeleton-list"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    {[...Array(5)].map((_, i) => (
      <div key={i} className="skeleton-item">
        <div className="skeleton-icon" />
        <div className="skeleton-text" />
      </div>
    ))}
  </motion.div>
) : (
  // normal list
)}
```

**CSS for skeleton:**
```css
.skeleton-item {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 📁 FAJLOVI ZA IZMENU - KOMPLETAN SPISAK

### Kritični (MUST do):
1. ✅ `c:\Vukixxx\src\components\ui\Toast.tsx` - Exit animation
2. ✅ `c:\Vukixxx\src\components\ui\Toast.css` - Ukloni keyframes
3. ✅ `c:\Vukixxx\src\components\ui\ConfirmDialog.tsx` - Exit animation
4. ✅ `c:\Vukixxx\src\components\ui\ConfirmDialog.css` - Ukloni keyframes
5. ✅ `c:\Vukixxx\src\components\ui\DraggablePanel.tsx` - Panel animations
6. ✅ `c:\Vukixxx\src\App.tsx` - AnimatePresence za panele + tab transitions
7. ✅ `c:\Vukixxx\src\components\prompts\PromptBrowser.tsx` - List stagger + FilterPanel toggle
8. ✅ `c:\Vukixxx\src\components\packs\PackList.tsx` - Pack list stagger

### Visok prioritet (SHOULD do):
9. ✅ `c:\Vukixxx\src\components\prompts\PromptViewer.tsx` - Button micro-interactions
10. ✅ `c:\Vukixxx\src\components\packs\PackDetail.tsx` - Prompt item animations
11. ✅ `c:\Vukixxx\src\components\prompts\FilterPanel.tsx` - Chip animations

### Nice-to-have (COULD do):
12. ⚪ Loading skeleton komponente (ako ostane vreme)
13. ⚪ Advanced spring configurations (fine-tuning)

---

## 🎨 ANIMATION DESIGN TOKENS

**Spring defaults:**
```tsx
const SPRING_FAST = { stiffness: 500, damping: 30 };    // Quick snappy
const SPRING_DEFAULT = { stiffness: 400, damping: 25 }; // Balanced
const SPRING_SMOOTH = { stiffness: 300, damping: 30 };  // Smooth gentle
```

**Duration defaults:**
```tsx
const DURATION_FAST = 0.15;     // Quick UI feedback
const DURATION_DEFAULT = 0.2;   // Standard transitions
const DURATION_SLOW = 0.3;      // Emphasized actions
```

**Stagger:**
```tsx
const STAGGER_FAST = 0.03;   // 30ms between items (lists)
const STAGGER_SLOW = 0.05;   // 50ms between items (cards)
```

---

## ✅ ACCEPTANCE CRITERIA

Po završetku Phase 4, aplikacija treba da ima:

1. **Smooth Transitions:**
   - ✅ Svi paneli fade in/out sa scale animation
   - ✅ Toast notifikacije slide in i slide out (ne instant)
   - ✅ ConfirmDialog ima smooth exit animation

2. **List Animations:**
   - ✅ PromptBrowser lista ima stagger effect (items appear jedan za drugim)
   - ✅ PackList ima stagger effect
   - ✅ Filter promene animiraju list items (smooth re-layout)

3. **View Transitions:**
   - ✅ Tab switching (memory/packs/settings) ima cross-fade
   - ✅ FilterPanel slide toggle (ne instant appear/disappear)
   - ✅ View mode switch (list ↔ grid) ima smooth layout animation

4. **Micro-Interactions:**
   - ✅ Buttons imaju hover scale
   - ✅ Cards imaju hover lift + shadow
   - ✅ Tap feedback na svim interactive elementima

5. **Empty States:**
   - ✅ Empty states imaju subtle entrance animation
   - ✅ Icons mogu imati gentle breathing animation (optional)

6. **No Regressions:**
   - ✅ Drag functionality panela MORA raditi (ne sme se pokvariti)
   - ✅ FilterPanel collapse/expand radi glatko
   - ✅ Graph 3D performance ostaje isti (ne dirati MemoryGraph.tsx)

---

## 🚨 RIZICI I MITIGATION

### Rizik 1: Framer-motion konflikt sa react-draggable

**Problem:** DraggablePanel koristi `react-draggable` za drag, a mi hoćemo framer-motion za animations.

**Mitigation:**
- NE koristiti framer-motion drag (keep react-draggable)
- Dodati framer-motion SAMO za initial/exit animations (inner wrapper)
- Test drag funkcionalnost nakon svake izmene

### Rizik 2: AnimatePresence breaking panel z-index

**Problem:** AnimatePresence može da izmeni DOM order i pokvari z-index stacking.

**Mitigation:**
- Keep inline `style={{ zIndex }}` props
- Test multi-panel scenarios
- Možda koristiti `mode="popLayout"` umesto default

### Rizik 3: Stagger delay za velike liste (100+ items)

**Problem:** `delay: index * 0.03` za 100 items = 3s delay za poslednji item.

**Mitigation:**
- Cap delay: `Math.min(index * 0.03, 0.3)`
- Ili: stagger samo prvih 10 items, ostali instant

### Rizik 4: Performance degradacija sa previše animations

**Problem:** Framer-motion animacije mogu usporiti app na slabijim mašinama.

**Mitigation:**
- Korisnik kaže da nema performance problema → ne brinemo se mnogo
- Koristiti `will-change: transform, opacity` u CSS gde treba
- Avoid animating width/height direktno (koristiti scale umesto)

---

## 📝 TESTING CHECKLIST

Pre finalizacije, testirati:

- [ ] Panel open/close (smooth fade + scale)
- [ ] Panel maximize/restore (smooth transition, ne instant)
- [ ] Panel drag (MORA raditi posle izmena)
- [ ] Panel z-index stacking (klik na panel brings to front)
- [ ] Toast appear + disappear (smooth slide)
- [ ] ConfirmDialog appear + disappear (smooth fade + scale)
- [ ] PromptBrowser list filter (stagger animation)
- [ ] View mode switch list ↔ grid (layout animation)
- [ ] FilterPanel toggle (smooth height animation)
- [ ] PackList stagger
- [ ] Tab switching (cross-fade)
- [ ] Button hover/tap na različitim komponentama
- [ ] Empty states animation
- [ ] Multi-panel scenario (otvoriti 3+ panela, testirati overlap)

---

## 🎯 SUCCESS METRICS

**Kako znamo da je Phase 4 uspešna:**

1. **Visual polish:** Aplikacija izgleda kao production app (ne kao prototype)
2. **Smooth feel:** Nema instant jumps/pops (sve je smooth)
3. **Delight factor:** Micro-interactions dodaju "juice" (buttons feel responsive)
4. **No bugs:** Drag, z-index, filters rade kao pre (no regressions)
5. **Performance:** App ostaje responsive (60fps animations)

**User feedback pitanja:**
- Da li aplikacija izgleda "profesionalno"?
- Da li su animacije previše spore/brze?
- Da li nešto smeta ili odvlači pažnju?

---

## 📦 DELIVERABLES

Po završetku Phase 4, developer će dostaviti:

1. **Updated komponente:**
   - 8 core komponenti sa framer-motion integracija
   - Updated CSS fajlovi (uklonjeni stari keyframes)

2. **Documentation:**
   - Animation design tokens fajl (spring configs, durations)
   - Comments u kodu za složenije animacije

3. **Demo:**
   - Video/GIF showcasing key animations
   - Before/after comparison

4. **Testing report:**
   - Checklist completion
   - Performance measurements (FPS, load times)
   - Bug list (if any)

---

## 🚀 POST-PHASE 4 (Future work - NE sada)

**Stvari koje NE radimo u ovoj fazi:**

- ❌ Performance optimizations (React.memo, code splitting) - nije potrebno
- ❌ Prompt versioning - to je Phase 3 work
- ❌ Pack import functionality - to je Phase 3 work
- ❌ Accessibility audit - može kasnije
- ❌ Keyboard shortcuts - može kasnije
- ❌ Testing infrastructure - može kasnije

**Focus: Samo animacije i UX polish!** 🎨

---

## ⏱️ ESTIMATED TIMELINE

**Ukupno:** 5-8 sati čistog development vremena

- Milestone 1 (Toast/Dialog): 30 min
- Milestone 2 (Panels): 1-2h
- Milestone 3 (Lists): 1-2h
- Milestone 4 (Views): 1h
- Milestone 5 (Micro-interactions): 1-2h
- Milestone 6 (Loading - optional): 1h
- Testing + bug fixes: 1-2h

**Realistic timeline sa pauzama:** 2-3 dana part-time ili 1 dan full-time.

---

## 📌 NOTES

- Framer-motion dokumentacija: https://www.framer.com/motion/
- Best practices: Koristiti spring physics za prirodan feel (ne linear easing)
- AnimatePresence `mode="wait"` za sequential, `mode="popLayout"` za simultaneous
- `layout` prop = automatic layout animations (magic!)
- Test na različitim browser-ima (Chrome, Firefox, Edge)

---

*Plan ready for approval and implementation!* 🚀
