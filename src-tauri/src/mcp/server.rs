//! MCP (Model Context Protocol) Server for Vukixxx
//!
//! Exposes Vukixxx prompts and memory packs to Claude and other
//! MCP-compatible AI assistants.
//!
//! Tools:
//! - list_prompts: List all available prompts
//! - get_prompt: Get a specific prompt by ID
//! - search_prompts: Search prompts by query
//! - list_packs: List all memory packs
//! - get_memory_pack: Get a memory pack with its prompts
//!
//! This is a stub implementation. Full MCP server will be implemented
//! when the MCP Rust SDK stabilizes.

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct McpServerConfig {
    pub enabled: bool,
    pub port: u16,
}

impl Default for McpServerConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            port: 3100,
        }
    }
}

/// MCP Server placeholder.
/// Will be implemented with proper stdio or SSE transport
/// once the MCP Rust SDK is stable.
pub struct McpServer {
    _config: McpServerConfig,
}

impl McpServer {
    pub fn new(config: McpServerConfig) -> Self {
        Self { _config: config }
    }

    /// Start the MCP server (stub)
    pub async fn start(&self) -> Result<(), String> {
        // TODO: Implement MCP server with stdio transport
        // The server will expose tools defined in tools.rs
        Ok(())
    }

    /// Stop the MCP server (stub)
    pub async fn stop(&self) -> Result<(), String> {
        Ok(())
    }
}
