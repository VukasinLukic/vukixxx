use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub prompts_dir: String,
    pub theme: String,
    pub language: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ai_provider: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ai_providers: Option<serde_json::Value>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            prompts_dir: String::new(),
            theme: "light".to_string(),
            language: "en".to_string(),
            ai_provider: None,
            ai_providers: None,
        }
    }
}

/// Get settings file path
fn get_settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    if !app_data.exists() {
        fs::create_dir_all(&app_data).map_err(|e| format!("Failed to create app data dir: {}", e))?;
    }
    Ok(app_data.join("settings.json"))
}

/// Load app settings from disk
#[tauri::command]
pub async fn load_settings(app: AppHandle) -> Result<AppSettings, String> {
    let path = get_settings_path(&app)?;

    if !path.exists() {
        let defaults = AppSettings::default();
        // Set default prompts dir
        let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
        let mut settings = defaults;
        settings.prompts_dir = app_data
            .join("prompts")
            .to_str()
            .unwrap_or("")
            .to_string();
        return Ok(settings);
    }

    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read settings: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Failed to parse settings: {}", e))
}

/// Save app settings to disk
#[tauri::command]
pub async fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    let path = get_settings_path(&app)?;
    let content =
        serde_json::to_string_pretty(&settings).map_err(|e| format!("Failed to serialize settings: {}", e))?;
    fs::write(&path, content).map_err(|e| format!("Failed to save settings: {}", e))
}
