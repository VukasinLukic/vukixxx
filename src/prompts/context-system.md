---
id: context-system
label: System Context
parent: master
category: core
---

# System Context & Constraints
*Auto-generated based on session history.*

## Environment
- **OS**: Windows 10/11
- **Shell**: PowerShell (default), CMD available
- **Package Manager**: npm (Node.js)
- **Node Version**: Ensure LTS version (18.x or 20.x recommended)
- **Editor**: VS Code with extensions

## Observed Constraints & Quirks

### Terminal & CLI
1. **Terminal Interactivity**: Interactive CLI commands (like `create-vite` prompts) hang or fail in the agentic environment.
   * *Solution*: Use non-interactive flags (`-y`, `--template`) or manually create config files.

2. **Long-Running Processes**: Dev servers (`npm run dev`) block the terminal.
   * *Solution*: Run in background or use separate terminal instances.

3. **npx Caution**: `npx` can be unsafe for interactive tools.
   * *Solution*: Install globally (`npm i -g`) or use local scripts.

### Ports & Networking
4. **Port Conflicts**: Default Vite port (5173) is often busy.
   * *Solution*: Allow Vite to auto-switch ports (it does this by default). Check output for actual URL.
   * *Manual*: Use `--port 3000` flag to specify different port.

5. **Localhost Access**: Use `localhost` or `127.0.0.1`, not `0.0.0.0` for local development.

### File System
6. **File Locking**: Windows file locking can occasionally cause issues with rapid deletes/writes.
   * *Solution*: Close programs using files, or use retry logic.

7. **Path Handling**: Always use forward slashes `/` in paths for compatibility, even on Windows, or use `path.resolve`.
   * *Windows-specific*: Backslashes `\` work but can cause issues in some tools.

8. **Case Sensitivity**: Windows is case-insensitive but preserves case. Keep filenames consistent.

9. **Long Paths**: Enable long path support if encountering `ENAMETOOLONG` errors.
   * *Registry*: `HKLM\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled = 1`

### npm & Dependencies
10. **npm Cache Issues**: Sometimes `npm install` fails due to cache.
    * *Solution*: `npm cache clean --force` then retry.

11. **Peer Dependencies**: npm 7+ is stricter about peer deps.
    * *Solution*: Use `--legacy-peer-deps` if needed, or fix version conflicts.

12. **node_modules Size**: Windows has issues with deeply nested node_modules.
    * *Solution*: Use npm 7+ (uses flat node_modules) or pnpm.

## Command Reliability Matrix

| Command | Status | Notes |
|---------|--------|-------|
| `npm install` | Reliable | May need `--legacy-peer-deps` for conflicts |
| `npm run dev` | Reliable | Background execution needed |
| `npm run build` | Reliable | Check for TypeScript/ESLint errors |
| `npx create-*` | Unreliable | Use flags like `-y --template` |
| `git` commands | Reliable | Use `--no-edit` for non-interactive |
| `rm -rf` | Unreliable | Use `rimraf` or PowerShell `Remove-Item -Recurse` |

## PowerShell Specifics
- **Execution Policy**: May need `Set-ExecutionPolicy RemoteSigned` for scripts
- **Environment Variables**: Use `$env:VAR_NAME` not `export VAR_NAME`
- **Command Chaining**: Use `;` instead of `&&` (or use `&&` in PowerShell 7+)
- **Delete Directory**: `Remove-Item -Recurse -Force .\folder\`
- **List Files**: `Get-ChildItem` or `ls` (alias)

## Recommended Tools
- **Terminal**: Windows Terminal (modern, GPU-accelerated)
- **Shell**: PowerShell 7+ or Git Bash for Unix compatibility
- **Package Manager**: Consider pnpm for faster installs
- **Process Manager**: PM2 for long-running Node processes

## VS Code Integration
- **Terminal**: Integrated terminal uses PowerShell by default
- **Extensions**: ESLint, Prettier, Path Intellisense recommended
- **Settings Sync**: Enable for consistent config across machines
