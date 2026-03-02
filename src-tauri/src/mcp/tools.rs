//! MCP Tool definitions for Vukixxx
//!
//! These tool schemas define what Claude (or other MCP clients)
//! can do with Vukixxx data.

use serde::{Deserialize, Serialize};

/// Tool: list_prompts
/// Returns a list of all prompts with their metadata.
#[derive(Debug, Serialize, Deserialize)]
pub struct ListPromptsInput {
    /// Optional category filter
    pub category: Option<String>,
    /// Optional search query
    pub query: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PromptSummary {
    pub id: String,
    pub label: String,
    pub category: String,
    pub tags: Vec<String>,
    pub updated_at: String,
}

/// Tool: get_prompt
/// Returns full content of a specific prompt.
#[derive(Debug, Serialize, Deserialize)]
pub struct GetPromptInput {
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PromptDetail {
    pub id: String,
    pub label: String,
    pub category: String,
    pub tags: Vec<String>,
    pub content: String,
    pub body_content: String,
    pub parent: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Tool: search_prompts
/// Search prompts by text query (fuzzy).
#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPromptsInput {
    pub query: String,
    pub limit: Option<usize>,
}

/// Tool: list_packs
/// Returns all memory packs with metadata.
#[derive(Debug, Serialize, Deserialize)]
pub struct PackSummary {
    pub id: String,
    pub name: String,
    pub description: String,
    pub prompt_count: usize,
    pub export_format: String,
}

/// Tool: get_memory_pack
/// Returns a memory pack with all its prompt contents.
#[derive(Debug, Serialize, Deserialize)]
pub struct GetPackInput {
    pub id: String,
    /// Export format override (toon | markdown | both)
    pub format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PackExport {
    pub id: String,
    pub name: String,
    pub system_role: Option<String>,
    pub content: String,
    pub token_count: usize,
}

/// MCP tool schema definitions (JSON Schema format)
/// These would be served via the MCP tools/list endpoint.
pub fn get_tool_schemas() -> Vec<serde_json::Value> {
    vec![
        serde_json::json!({
            "name": "list_prompts",
            "description": "List all prompts in the Vukixxx knowledge base",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Filter by category (core, design, backend, marketing, other)",
                        "enum": ["core", "design", "backend", "marketing", "other"]
                    },
                    "query": {
                        "type": "string",
                        "description": "Optional search query"
                    }
                }
            }
        }),
        serde_json::json!({
            "name": "get_prompt",
            "description": "Get the full content of a specific prompt by ID",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "The prompt ID"
                    }
                },
                "required": ["id"]
            }
        }),
        serde_json::json!({
            "name": "search_prompts",
            "description": "Search prompts by text query with fuzzy matching",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max results (default 10)",
                        "default": 10
                    }
                },
                "required": ["query"]
            }
        }),
        serde_json::json!({
            "name": "list_packs",
            "description": "List all memory packs",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        }),
        serde_json::json!({
            "name": "get_memory_pack",
            "description": "Get a memory pack with all prompt contents, ready to inject as AI context",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "The pack ID"
                    },
                    "format": {
                        "type": "string",
                        "description": "Export format (toon, markdown, both)",
                        "enum": ["toon", "markdown", "both"],
                        "default": "toon"
                    }
                },
                "required": ["id"]
            }
        }),
    ]
}
