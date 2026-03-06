# Vukixxx Design System - Complete UI Specification

> Use this prompt to implement the **exact visual design** of the Vukixxx Chrome Extension to match the desktop app. This is a design-only specification—all functionality is already implemented. Your task is to apply this design system pixel-perfectly.

---

## 🎨 Design Philosophy

**Apple Human Interface Guidelines (HIG) inspired**
- Clean, minimal, spacious
- Glassmorphism with subtle depth
- Smooth animations (150ms ease transitions)
- Light mode only
- System font stack (-apple-system)

---

## 📐 Design Tokens

### Typography

```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-mono: "SF Mono", "Consolas", "Monaco", monospace;

/* Font Smoothing (CRITICAL - Always apply) */
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;

/* Font Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;

/* Font Sizes */
--text-xs: 10px;   /* Tags, labels */
--text-sm: 11px;   /* Buttons, actions */
--text-base: 12px; /* Body, list items */
--text-md: 13px;   /* Inputs, larger body */
--text-lg: 14px;   /* Headings */

/* Letter Spacing */
--tracking-tight: -0.02em;  /* Headings */
--tracking-normal: 0em;     /* Body */
--tracking-wide: 0.3px;     /* Small caps, labels */
```

### Colors

```css
/* Background */
--color-bg-app: #f5f5f7;              /* Main app background */
--color-bg-panel: rgba(245, 245, 247, 0.8);  /* Panel background */

/* Text */
--color-text-primary: #1d1d1f;        /* Primary text (black) */
--color-text-secondary: #86868b;      /* Secondary text (gray) */
--color-text-tertiary: #c7c7cc;       /* Placeholder, disabled */

/* Accent */
--color-accent: #007aff;              /* Apple blue - primary action */
--color-accent-hover: #0056b3;        /* Hover state */

/* Status Colors */
--color-success: #34c759;             /* Green */
--color-warning: #ff9500;             /* Orange */
--color-error: #ff3b30;               /* Red */

/* Borders */
--color-border-light: rgba(0, 0, 0, 0.06);   /* Light dividers */
--color-border-medium: rgba(0, 0, 0, 0.08);  /* Input borders */
--color-border-accent: rgba(0, 122, 255, 0.2); /* Focus rings */

/* Overlays */
--color-overlay: rgba(0, 0, 0, 0.5);  /* Modal backdrop */
--color-overlay-light: rgba(0, 0, 0, 0.05);  /* Hover backgrounds */
--color-overlay-accent: rgba(0, 122, 255, 0.08);  /* Accent tint */
```

### Glassmorphism

```css
/* Primary Glass (Widget container, popups) */
--glass-bg: rgba(255, 255, 255, 0.92);
--glass-border: rgba(0, 0, 0, 0.08);
--glass-shadow:
  0 8px 32px rgba(0, 0, 0, 0.12),
  0 2px 8px rgba(0, 0, 0, 0.06);
--glass-blur: 24px;

backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
border: 1px solid rgba(0, 0, 0, 0.08);
box-shadow:
  0 8px 32px rgba(0, 0, 0, 0.12),
  0 2px 8px rgba(0, 0, 0, 0.06);

/* Secondary Glass (Cards, panels) */
--glass-card-bg: rgba(245, 245, 247, 0.6);
--glass-card-hover: rgba(0, 122, 255, 0.08);
```

### Spacing

```css
--spacing-xs: 4px;   /* Tight gaps */
--spacing-sm: 6px;   /* Small gaps */
--spacing-md: 8px;   /* Default gaps */
--spacing-lg: 10px;  /* Medium padding */
--spacing-xl: 12px;  /* Large padding */
--spacing-2xl: 16px; /* Section padding */
--spacing-3xl: 20px; /* Modal padding */
```

### Border Radius

```css
--radius-sm: 6px;    /* Buttons, tags */
--radius-md: 8px;    /* Cards, inputs */
--radius-lg: 10px;   /* Panels, dropdowns */
--radius-xl: 12px;   /* Modals */
--radius-2xl: 16px;  /* Widget container */
--radius-round: 9999px; /* Pills */
```

### Shadows

```css
/* Elevation Levels */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
--shadow-lg:
  0 8px 32px rgba(0, 0, 0, 0.12),
  0 2px 8px rgba(0, 0, 0, 0.06);
--shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.24);

/* Focus Ring */
--focus-ring: 0 0 0 3px rgba(0, 122, 255, 0.12);
```

### Transitions

```css
/* Standard Transition (Use everywhere) */
transition: all 0.15s ease;

/* Specific Properties (Better performance) */
transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
```

---

## 🧩 Component Specifications

### 1. Container (Widget/Popup)

```css
.vukixx-container {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

### 2. Header

```css
.vukixx-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(245, 245, 247, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  user-select: none;
}

.vukixx-header-title {
  font-size: 12px;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: 0.3px;
  text-align: center;
  flex: 1;
}

.vukixx-header-actions {
  display: flex;
  gap: 6px;
}
```

### 3. Buttons

**Primary Button (Call-to-action)**
```css
.btn-primary {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #007aff;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

**Secondary Button (Actions)**
```css
.btn-secondary {
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  background: rgba(245, 245, 247, 0.8);
  font-size: 11px;
  color: #1d1d1f;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(0, 122, 255, 0.08);
  border-color: rgba(0, 122, 255, 0.2);
  color: #007aff;
}
```

**Icon Button (Small, header)**
```css
.btn-icon {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86868b;
  transition: all 0.15s ease;
}

.btn-icon:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #1d1d1f;
}

/* Close button variant */
.btn-icon.close:hover {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}
```

### 4. Input Fields

```css
.input-field {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  color: #1d1d1f;
  outline: none;
  transition: all 0.2s ease;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
}

.input-field:focus {
  border-color: #007aff;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
}

.input-field::placeholder {
  color: #c7c7cc;
}

/* With icon (search) */
.input-with-icon {
  padding-left: 34px;
}

.input-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #c7c7cc;
  pointer-events: none;
}
```

### 5. Cards / List Items

```css
.card {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(245, 245, 247, 0.6);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card:hover {
  background: rgba(0, 122, 255, 0.08);
}

.card.selected {
  background: rgba(0, 122, 255, 0.12);
  border: 1px solid rgba(0, 122, 255, 0.3);
}

.card-title {
  font-size: 12px;
  font-weight: 500;
  color: #1d1d1f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-subtitle {
  font-size: 10px;
  color: #86868b;
  margin-top: 2px;
}
```

### 6. Tags / Badges

```css
.tag {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  font-size: 10px;
  font-weight: 500;
  border-radius: 6px;
}

/* Status Variants */
.tag.success {
  background: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

.tag.warning {
  background: rgba(255, 149, 0, 0.1);
  color: #ff9500;
}

.tag.error {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}
```

### 7. Dropdown / Menu

```css
.dropdown {
  position: absolute;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  min-width: 180px;
  overflow: hidden;
  z-index: 100;
}

.dropdown-item {
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #1d1d1f;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.dropdown-item:hover {
  background: rgba(0, 122, 255, 0.08);
  color: #007aff;
}

.dropdown-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 4px 0;
}
```

### 8. Modal

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.modal-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
```

### 9. Empty State

```css
.empty-state {
  text-align: center;
  color: #86868b;
  font-size: 12px;
  padding: 40px 20px;
}

.empty-state-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  opacity: 0.3;
}

.empty-state-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.empty-state-description {
  font-size: 11px;
  color: #c7c7cc;
}
```

### 10. Scrollbar

```css
/* Custom scrollbar (Webkit only) */
.scrollable::-webkit-scrollbar {
  width: 6px;
}

.scrollable::-webkit-scrollbar-track {
  background: transparent;
}

.scrollable::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.scrollable::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}
```

---

## 🎭 Animations & States

### Hover States

```css
/* Buttons */
button:hover {
  /* Lighten or add accent tint */
  background: rgba(0, 122, 255, 0.08);
  border-color: rgba(0, 122, 255, 0.2);
  color: #007aff;
}

/* Cards */
.card:hover {
  background: rgba(0, 122, 255, 0.08);
  transform: translateY(-1px); /* Optional subtle lift */
}
```

### Active/Pressed States

```css
button:active {
  transform: scale(0.98);
}
```

### Focus States

```css
input:focus,
button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
}
```

### Success Feedback

```css
/* Show checkmark and green tint */
.btn-success {
  background: #34c759;
  color: white;
}

/* Temporary state (1.5s) */
.btn-saved {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
  pointer-events: none;
}
```

### Loading States

```css
.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(0, 122, 255, 0.2);
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 📱 Layout Patterns

### Popup Layout (Chrome Extension)

```css
.popup-container {
  width: 360px;
  height: 480px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

### Section Spacing

```css
.section {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
```

### Flex Gaps (Preferred over margins)

```css
.container {
  display: flex;
  gap: 8px; /* Use gap instead of margins */
  flex-direction: column;
}
```

---

## 🎯 Implementation Checklist

When applying this design to the Chrome Extension:

### ✅ Typography
- [ ] Use -apple-system font stack
- [ ] Apply -webkit-font-smoothing: antialiased
- [ ] Use correct font sizes (10px-14px range)
- [ ] Apply letter-spacing to titles (0.3px)
- [ ] Use font-weight: 500 for buttons, 600 for headings

### ✅ Colors
- [ ] Primary text: #1d1d1f
- [ ] Secondary text: #86868b
- [ ] Accent blue: #007aff
- [ ] Use rgba() for all overlays/backgrounds
- [ ] Error color: #ff3b30 (for close buttons)

### ✅ Glassmorphism
- [ ] backdrop-filter: blur(24px)
- [ ] -webkit-backdrop-filter: blur(24px) (Safari)
- [ ] background: rgba(255, 255, 255, 0.92)
- [ ] border: 1px solid rgba(0, 0, 0, 0.08)
- [ ] Multi-layer shadows (large + small)

### ✅ Spacing
- [ ] Use 4px base unit (4, 6, 8, 10, 12, 16, 20)
- [ ] Padding: 10px 14px for headers
- [ ] Padding: 8px 10px for cards
- [ ] Gap: 6-10px for flex containers

### ✅ Borders & Radius
- [ ] Border radius: 6-16px range
- [ ] Border color: rgba(0, 0, 0, 0.06-0.08)
- [ ] Focus ring: 3px blue glow

### ✅ Transitions
- [ ] Use transition: all 0.15s ease
- [ ] Hover states change in 150ms
- [ ] No abrupt color/size changes

### ✅ Buttons
- [ ] Primary: Blue fill (#007aff)
- [ ] Secondary: Light gray with blue hover
- [ ] Icon buttons: 24x24px, light gray bg
- [ ] Close button: Red tint on hover

### ✅ Inputs
- [ ] Border radius: 10px
- [ ] Padding: 10px 12px
- [ ] Focus: Blue ring (0 0 0 3px rgba(0, 122, 255, 0.12))
- [ ] Placeholder: #c7c7cc

### ✅ Cards/Lists
- [ ] Background: rgba(245, 245, 247, 0.6)
- [ ] Hover: rgba(0, 122, 255, 0.08)
- [ ] Selected: rgba(0, 122, 255, 0.12) + border
- [ ] Border radius: 8px

### ✅ Scrollbars
- [ ] Width: 6px
- [ ] Track: transparent
- [ ] Thumb: rgba(0, 0, 0, 0.15), 3px radius
- [ ] Hover: rgba(0, 0, 0, 0.25)

---

## 🚨 Critical Design Rules

### DO ✅
- Use rgba() for all semi-transparent colors
- Apply backdrop-filter + -webkit-backdrop-filter together
- Use flex gap instead of margins
- Use transition: all 0.15s ease everywhere
- Apply -webkit-font-smoothing: antialiased
- Use box-shadow with 2 layers (large + small)
- Keep font sizes 10-14px range
- Use border-radius 6-16px range
- Apply letter-spacing to small text (0.3px)

### DON'T ❌
- Don't use pure black (#000) - use #1d1d1f
- Don't use pure white borders - use rgba(0, 0, 0, 0.08)
- Don't use margin for gaps - use flex gap
- Don't use transitions longer than 200ms
- Don't use font sizes below 10px or above 14px
- Don't use sharp corners - minimum 6px radius
- Don't use solid backgrounds - always use rgba or gradients
- Don't skip -webkit- prefixes for backdrop-filter

---

## 🎨 Color Palette Reference

```css
/* Quick Copy-Paste */
--text-primary:    #1d1d1f;
--text-secondary:  #86868b;
--text-tertiary:   #c7c7cc;
--accent:          #007aff;
--accent-hover:    #0056b3;
--success:         #34c759;
--warning:         #ff9500;
--error:           #ff3b30;
--bg-app:          #f5f5f7;
--bg-panel:        rgba(245, 245, 247, 0.8);
--bg-glass:        rgba(255, 255, 255, 0.92);
--border-light:    rgba(0, 0, 0, 0.06);
--border-medium:   rgba(0, 0, 0, 0.08);
--overlay:         rgba(0, 0, 0, 0.5);
--overlay-light:   rgba(0, 0, 0, 0.05);
--overlay-accent:  rgba(0, 122, 255, 0.08);
```

---

## 📝 Example: Complete Button Styles

```css
/* Copy-paste ready button system */

/* Primary CTA */
.btn-primary {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: #007aff;
  color: white;
  font-size: 12px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-font-smoothing: antialiased;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Secondary Action */
.btn-secondary {
  padding: 6px 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  background: rgba(245, 245, 247, 0.8);
  color: #1d1d1f;
  font-size: 11px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-font-smoothing: antialiased;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(0, 122, 255, 0.08);
  border-color: rgba(0, 122, 255, 0.2);
  color: #007aff;
}

.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Icon Button */
.btn-icon {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  color: #86868b;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #1d1d1f;
}

.btn-icon.close:hover {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}
```

---

**This is the complete Vukixxx design system. Apply it pixel-perfectly to match the desktop app aesthetic.**
