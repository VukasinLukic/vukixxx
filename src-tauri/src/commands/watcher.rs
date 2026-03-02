use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

/// Global watcher state - holds the active file watcher
static WATCHER: Mutex<Option<RecommendedWatcher>> = Mutex::new(None);

/// Start watching the prompts directory for changes.
/// Emits "fs-change" events to the frontend with the event type and path.
#[tauri::command]
pub async fn start_watcher(app: AppHandle) -> Result<(), String> {
    // Get prompts dir
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let prompts_dir = app_data.join("prompts");

    if !prompts_dir.exists() {
        std::fs::create_dir_all(&prompts_dir)
            .map_err(|e| format!("Failed to create prompts dir: {}", e))?;
    }

    let app_clone = app.clone();

    let watcher = notify::recommended_watcher(move |res: Result<notify::Event, notify::Error>| {
        match res {
            Ok(event) => {
                // Only care about .md file changes
                let is_md = event.paths.iter().any(|p| {
                    p.extension().map_or(false, |ext| ext == "md")
                });

                if !is_md {
                    return;
                }

                let event_type = match event.kind {
                    EventKind::Create(_) => "create",
                    EventKind::Modify(_) => "modify",
                    EventKind::Remove(_) => "remove",
                    _ => return,
                };

                let path = event
                    .paths
                    .first()
                    .and_then(|p| p.to_str())
                    .unwrap_or("")
                    .to_string();

                let _ = app_clone.emit("fs-change", serde_json::json!({
                    "type": event_type,
                    "path": path,
                }));
            }
            Err(e) => {
                eprintln!("File watcher error: {}", e);
            }
        }
    })
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    // Store watcher (stop old one first)
    let mut guard = WATCHER.lock().map_err(|e| e.to_string())?;

    // Start new watcher
    let mut new_watcher = watcher;
    new_watcher
        .watch(&prompts_dir, RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch dir: {}", e))?;

    // Replace old watcher (drops the previous one, stopping it)
    *guard = Some(new_watcher);

    Ok(())
}

/// Stop the file watcher
#[tauri::command]
pub async fn stop_watcher() -> Result<(), String> {
    let mut guard = WATCHER.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}
