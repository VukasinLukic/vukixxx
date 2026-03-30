import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { getMyContextSchema, getMyContext } from './tools/getMyContext.js';
import { getProjectSchema, getProject } from './tools/getProject.js';
import { updateProjectSchema, updateProject } from './tools/updateProject.js';
import { addClaudeLogSchema, addClaudeLog } from './tools/addClaudeLog.js';
import { addTaskSchema, addTask } from './tools/addTask.js';
import { completeTaskSchema, completeTask } from './tools/completeTask.js';
import { generateClaudeMdSchema, generateClaudeMd } from './tools/generateClaudeMd.js';

const server = new McpServer({
  name: 'vukixx-mcp',
  version: '1.0.0',
});

server.tool(
  'get_my_context',
  'Returns developer profile + all active projects + last 3 Claude logs per project. Call this first in every conversation.',
  getMyContextSchema.shape,
  async () => ({ content: [{ type: 'text' as const, text: await getMyContext() }] })
);

server.tool(
  'get_project',
  'Returns detailed info for a specific project: all logs, open tasks, and relevant prompts from library.',
  getProjectSchema.shape,
  async (args) => ({ content: [{ type: 'text' as const, text: await getProject(args) }] })
);

server.tool(
  'update_project',
  'Updates project fields (nextStep, status, notes, priority) with timestamp. Call this after finishing work.',
  updateProjectSchema.shape,
  async (args) => ({ content: [{ type: 'text' as const, text: await updateProject(args) }] })
);

server.tool(
  'add_claude_log',
  'Logs what Claude did on a project. Also triggers CLAUDE.md regeneration. Call this at the end of every work session.',
  addClaudeLogSchema.shape,
  async (args) => ({ content: [{ type: 'text' as const, text: await addClaudeLog(args) }] })
);

server.tool(
  'add_task',
  'Creates a new task in the task queue for a project. Use this when identifying work for a future session.',
  addTaskSchema.shape,
  async (args) => ({ content: [{ type: 'text' as const, text: await addTask(args) }] })
);

server.tool(
  'complete_task',
  'Marks a task as done with a result. If high priority, also updates project nextStep.',
  completeTaskSchema.shape,
  async (args) => ({ content: [{ type: 'text' as const, text: await completeTask(args) }] })
);

server.tool(
  'generate_claude_md',
  'Regenerates CLAUDE.md content for a project and stores it in Firestore. Desktop app can sync it to disk.',
  generateClaudeMdSchema.shape,
  async (args) => ({ content: [{ type: 'text' as const, text: await generateClaudeMd(args) }] })
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[vukixx-mcp] Server running on stdio — 7 tools available');
