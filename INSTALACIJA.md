# 📦 Vukixxx - Vodič za instalaciju

## 🎯 Šta trebaš da imaš?

### Obavezno:
1. **Node.js** (v18 ili noviji)
   - Download: https://nodejs.org/
   - Proveri verziju: `node --version`
   - Preporuka: Instalirati **LTS verziju** (Long Term Support)

2. **npm** ili **pnpm** (dolazi sa Node.js)
   - npm dolazi automatski sa Node.js
   - pnpm (brži): `npm install -g pnpm`

3. **Git** (za verzionisanje)
   - Download: https://git-scm.com/
   - Proveri: `git --version`

### Opciono (za Tauri desktop app):
4. **Rust** + **Tauri prerequisites**
   - Rust: https://www.rust-lang.org/tools/install
   - Tauri setup: https://tauri.app/v1/guides/getting-started/prerequisites

5. **Visual Studio Build Tools** (Windows)
   - Download: https://visualstudio.microsoft.com/downloads/
   - Izaberi "Build Tools for Visual Studio 2022"
   - Selektuj: "Desktop development with C++"

---

## 🚀 Brza instalacija (Browser verzija)

### 1. Kloniraj repo
```bash
git clone https://github.com/your-username/vukixxx.git
cd vukixxx
```

### 2. Instaliraj dependencies
```bash
npm install
# ili
pnpm install
```

### 3. Pokreni development server
```bash
npm run dev
# ili
pnpm dev
```

### 4. Otvori browser
```
http://localhost:5173
```

**Gotovo! 🎉**

---

## 🖥️ Desktop app (Tauri) - Opciono

### Prerequisites
1. Instalirati Rust:
   ```bash
   # Windows (PowerShell)
   winget install -e --id Rustlang.Rust.GNU

   # macOS/Linux
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Restartuj terminal da se učitaju Rust environment variables

### Instalacija
```bash
# 1. Instaliraj dependencies (ako nisi već)
npm install

# 2. Pokreni Tauri dev mode
npm run tauri:dev

# 3. Build desktop app (optional)
npm run tauri:build
```

**Desktop app je gotov! 🚀**

---

## 📋 Lista svih paketa

### Runtime Dependencies
```json
{
  "@dnd-kit/core": "^6.3.1",           // Drag & drop
  "@dnd-kit/sortable": "^10.0.0",      // Sortable lists
  "@tauri-apps/api": "^2.10.1",        // Tauri API
  "buffer": "^6.0.3",                   // Buffer polyfill
  "clsx": "^2.0.0",                     // Class names utility
  "dexie": "^4.3.0",                    // IndexedDB wrapper
  "framer-motion": "^10.16.4",         // Animations
  "fuse.js": "^7.1.0",                  // Fuzzy search
  "gray-matter": "^4.0.3",              // Frontmatter parsing
  "lucide-react": "^0.292.0",           // Icons
  "react": "^18.2.0",                   // UI framework
  "react-dom": "^18.2.0",
  "react-draggable": "^4.4.6",         // Draggable panels
  "react-force-graph-3d": "^1.24.2",   // 3D graph
  "react-markdown": "^9.0.0",          // Markdown rendering
  "three": "^0.160.0",                  // 3D graphics
  "zustand": "^5.0.11"                  // State management
}
```

### Dev Dependencies
```json
{
  "@tauri-apps/cli": "^2.10.0",        // Tauri CLI
  "@vitejs/plugin-react": "^4.2.0",   // Vite React plugin
  "typescript": "^5.9.3",               // Type checking
  "vite": "^5.0.0",                     // Build tool
  "eslint": "^8.53.0"                   // Linting
}
```

---

## 🔧 Build & Deploy

### Development Build
```bash
npm run dev          # Browser version
npm run tauri:dev    # Desktop version
```

### Production Build
```bash
# Browser (static site)
npm run build
npm run preview      # Preview production build

# Desktop app
npm run tauri:build  # Generates installer (.exe, .dmg, .AppImage)
```

### Build outputs:
- **Browser**: `dist/` folder (deploy na Vercel/Netlify/GitHub Pages)
- **Tauri**: `src-tauri/target/release/bundle/` (instaleri)

---

## 🌐 Deploy opcije

### 1. **Vercel** (preporučeno za browser)
```bash
npm install -g vercel
vercel login
vercel
```

### 2. **Netlify**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### 3. **GitHub Pages**
```bash
# 1. Update vite.config.js
base: '/vukixxx/'

# 2. Build
npm run build

# 3. Deploy
npm install -g gh-pages
gh-pages -d dist
```

### 4. **Self-hosted** (Docker)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

---

## 🐛 Troubleshooting

### Problem: `npm install` fails
**Rešenje:**
```bash
# Obriši node_modules i package-lock.json
rm -rf node_modules package-lock.json

# Očisti npm cache
npm cache clean --force

# Probaj ponovo
npm install
```

### Problem: Tauri build fails (Windows)
**Rešenje:**
1. Instaliraj Visual Studio Build Tools
2. Proveri Rust: `rustc --version`
3. Update Rust: `rustup update`
4. Restartuj terminal

### Problem: Port 5173 already in use
**Rešenje:**
```bash
# Pronađi proces
netstat -ano | findstr :5173

# Ugasi proces
taskkill /PID <PID> /F

# Ili promeni port u vite.config.js
server: { port: 3000 }
```

### Problem: Module not found errors
**Rešenje:**
```bash
# Reinstaliraj dependencies
npm install

# Ili ako je specifican paket problem
npm install <package-name>
```

---

## 📚 Dodatni resursi

### Official Docs
- **Vite**: https://vitejs.dev/
- **React**: https://react.dev/
- **Tauri**: https://tauri.app/
- **Three.js**: https://threejs.org/

### Learning Resources
- **React Tutorial**: https://react.dev/learn
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Zustand Guide**: https://docs.pmnd.rs/zustand/getting-started/introduction

### Community
- **Discord**: [discord.gg/vukixxx](https://discord.gg)
- **GitHub Discussions**: [github.com/vukixxx/discussions](https://github.com)
- **Stack Overflow**: Tag `vukixxx`

---

## ✅ Checklist pre production-a

- [ ] Environment variables konfigurisane
- [ ] Error tracking setup (Sentry?)
- [ ] Analytics setup (Plausible/Umami?)
- [ ] SEO metadata
- [ ] Social media cards (og:image)
- [ ] Lighthouse score > 90
- [ ] Security headers konfigurisani
- [ ] HTTPS enabled
- [ ] Backup strategy
- [ ] Monitoring setup

---

## 🤝 Podrška

Imaš problem? Kontaktiraj nas:
- **GitHub Issues**: [github.com/vukixxx/issues](https://github.com)
- **Discord**: [discord.gg/vukixxx](https://discord.gg)
- **Email**: [support@vukixxx.com](mailto:support@vukixxx.com)

---

*Happy coding! 🚀*
