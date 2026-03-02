use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Get the prompts directory path (~/.vukixxx/prompts)
fn get_prompts_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(app_data.join("prompts"))
}

/// Internal helper - ensures prompts directory exists
pub async fn ensure_prompts_dir_internal(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = get_prompts_dir(app)?;
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Failed to create prompts dir: {}", e))?;
    }
    Ok(dir)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PromptFile {
    pub filename: String,
    pub content: String,
}

/// Ensure prompts directory exists and return its path
#[tauri::command]
pub async fn ensure_prompts_dir(app: AppHandle) -> Result<String, String> {
    let dir = ensure_prompts_dir_internal(&app).await?;
    dir.to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid path encoding".to_string())
}

/// Read all .md files from the prompts directory
#[tauri::command]
pub async fn read_prompts_dir(app: AppHandle) -> Result<Vec<PromptFile>, String> {
    let dir = ensure_prompts_dir_internal(&app).await?;

    let mut files = Vec::new();

    let entries = fs::read_dir(&dir).map_err(|e| format!("Failed to read dir: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.extension().map_or(false, |ext| ext == "md") {
            let filename = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            let content =
                fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", filename, e))?;

            files.push(PromptFile { filename, content });
        }
    }

    Ok(files)
}

/// Read a single prompt file
#[tauri::command]
pub async fn read_prompt_file(app: AppHandle, filename: String) -> Result<String, String> {
    let dir = ensure_prompts_dir_internal(&app).await?;
    let path = dir.join(&filename);

    // Security: prevent path traversal
    if !path.starts_with(&dir) {
        return Err("Invalid filename".to_string());
    }

    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", filename, e))
}

/// Write a prompt file (create or update)
#[tauri::command]
pub async fn write_prompt_file(
    app: AppHandle,
    filename: String,
    content: String,
) -> Result<(), String> {
    let dir = ensure_prompts_dir_internal(&app).await?;
    let path = dir.join(&filename);

    // Security: prevent path traversal
    if !path.starts_with(&dir) {
        return Err("Invalid filename".to_string());
    }

    fs::write(&path, &content).map_err(|e| format!("Failed to write {}: {}", filename, e))
}

/// Delete a prompt file
#[tauri::command]
pub async fn delete_prompt_file(app: AppHandle, filename: String) -> Result<(), String> {
    let dir = ensure_prompts_dir_internal(&app).await?;
    let path = dir.join(&filename);

    // Security: prevent path traversal
    if !path.starts_with(&dir) {
        return Err("Invalid filename".to_string());
    }

    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete {}: {}", filename, e))?;
    }

    Ok(())
}
