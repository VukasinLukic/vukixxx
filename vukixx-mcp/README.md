# vukixx-mcp

MCP server za VukiXX — Claude ima read/write pristup projekatima, logovima i task queue-u kroz Firestore.

## Setup

### 1. Instalacija

```bash
cd vukixx-mcp
npm install
npm run build
```

### 2. Firebase konfiguracija

Kopiraj `FIREBASE_SERVICE_ACCOUNT` JSON iz `C:\Users\INSOMNIA\vukixx-extension\server\.env`:

```bash
cp .env.example .env
# Zatim edituj .env i ubaci FIREBASE_SERVICE_ACCOUNT vrednost
```

### 3. Claude Desktop konfiguracija

Dodaj u `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vukixx": {
      "command": "node",
      "args": ["C:/Vukixxx/vukixx-mcp/dist/index.js"],
      "env": {
        "FIREBASE_SERVICE_ACCOUNT": "{...paste JSON string here...}"
      }
    }
  }
}
```

### 4. Test

```bash
# Smoke test — treba da ispiše "[vukixx-mcp] Server running on stdio"
node dist/index.js
```

## MCP Tools

| Tool | Parametri | Opis |
|------|-----------|------|
| `get_my_context` | — | Profil + aktivni projekti + poslednja 3 loga po projektu |
| `get_project` | `project_id` | Detalji projekta + svi logovi + relevantni promptovi |
| `update_project` | `project_id, fields` | Update nextStep/status/notes/priority |
| `add_claude_log` | `project_id, entry, work_done?` | Snimi šta je Claude uradio |
| `add_task` | `project_id, task, priority` | Kreiraj task u task queue-u |
| `complete_task` | `task_id, result` | Završi task, ažurira project nextStep |
| `generate_claude_md` | `project_id` | Regeneriši CLAUDE.md u Firestore |

## Firestore kolekcije

- `digitalTwin/profile` — korisnički profil
- `projects/{id}` — projekti (ima `claudeMd` polje posle generate_claude_md)
- `claudeLogs/{id}` — log unosi
- `tasks/{id}` — task queue (nova kolekcija)
- `prompts/{id}` — promptovi iz extension-a

## Composite Indexes

Deploy `firestore.indexes.json` iz root-a projekta:
```bash
firebase deploy --only firestore:indexes
```
