---
id: context-platform
label: Platform Context
parent: master
category: core
---

# Platform Context (Vukixxx App)
*Technical details about this React application.*

## Stack
- **Framework**: React 18 + Vite 5
- **Styling**: Vanilla CSS Variables (Apple HIG) + CSS Modules
- **Visuals**: Framer Motion for animations
- **3D**: `react-force-graph-3d` (wraps Three.js)
- **Panels**: `react-draggable` for window management
- **Icons**: `lucide-react` icon library
- **Markdown**: `react-markdown` + `gray-matter` for YAML parsing

## Known Issues & Fixes
1. **Three.js Multiple Instances**:
   - *Issue*: `react-force-graph-3d` brings its own `three` version, causing multiple instance warnings and context crashes.
   - *Fix*: Use `overrides` in `package.json` to force a single version of `three`.

2. **WebGPU Import Error**:
   - *Issue*: Newer Three.js versions structure exports differently.
   - *Fix*: Ensure minimal aliasing in `vite.config.js` and keep dependencies updated.

3. **Glassmorphism**:
   - *Technique*: Heavy use of `backdrop-filter: blur(20px)` and subtle white/translucent backgrounds (`rgba(255,255,255,0.7)`).
   - *Note*: `backdrop-filter` has performance implications; use sparingly on low-end devices.

4. **DAG Mode in Force Graph**:
   - *Issue*: Default force layout creates random node positions.
   - *Fix*: Use `dagMode="td"` (top-down) or `dagMode="lr"` (left-right) for hierarchical tree layout.

5. **Node Interaction**:
   - *Hover*: Use `onNodeHover` callback to highlight connected nodes/links.
   - *Click*: Use `cameraPosition()` method with animation duration for smooth zoom to node.

## Architecture
- **Data Source**: Markdown files in `src/prompts/`.
- **Loading**: `import.meta.glob` used for filesystem-like loading in Browser (eager mode for immediate availability).
- **Routing**: Virtual/State-based (Dock tabs), not React Router (for desktop-like feel).
- **Panel System**: Z-index managed centrally in App.jsx for proper stacking.

## Component Structure
```
src/
  components/
    layout/     - Dock navigation
    memory/     - 3D graph visualization
    prompts/    - Browser and viewer
    ui/         - Reusable components (DraggablePanel)
  lib/          - Utilities and hooks
  prompts/      - Markdown prompt files
```

## Prompt File Format
```yaml
---
id: unique-identifier
label: Display Name
parent: parent-id (or null for root)
category: core|design|backend|marketing|other
type: root|prompt
---

# Markdown Content
Your prompt content here...
```

## Design System
- **Colors**: Apple-inspired light palette with blue accent (#0071e3)
- **Radius**: 8px (small), 12px (medium), 20px (large)
- **Shadows**: Multi-layer soft shadows for depth
- **Typography**: SF Pro / system font stack
- **Spacing**: 4px base unit (xs: 4, sm: 8, md: 16, lg: 24, xl: 32)

## Performance Considerations
- Use `warmupTicks` in ForceGraph3D for stable initial layout
- Limit `linkDirectionalParticles` count for many nodes
- Consider `nodeThreeObjectExtend: false` for custom node rendering
- Use `enableNodeDrag: false` when node positions are fixed (DAG mode)
