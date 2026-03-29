mod commands;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

#[tauri::command]
fn toggle_widget(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(widget) = app.get_webview_window("widget") {
        if widget.is_visible().unwrap_or(false) {
            widget.hide().map_err(|e| e.to_string())?;
        } else {
            widget.show().map_err(|e| e.to_string())?;
            widget.set_focus().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(main) = app.get_webview_window("main") {
        main.show().map_err(|e| e.to_string())?;
        main.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn toggle_save_widget(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(widget) = app.get_webview_window("save-widget") {
        if widget.is_visible().unwrap_or(false) {
            widget.hide().map_err(|e| e.to_string())?;
        } else {
            widget.show().map_err(|e| e.to_string())?;
            widget.set_focus().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::filesystem::read_prompts_dir,
            commands::filesystem::read_prompt_file,
            commands::filesystem::write_prompt_file,
            commands::filesystem::delete_prompt_file,
            commands::filesystem::ensure_prompts_dir,
            commands::filesystem::write_claude_md,
            commands::settings::load_settings,
            commands::settings::save_settings,
            commands::watcher::start_watcher,
            commands::watcher::stop_watcher,
            toggle_widget,
            toggle_save_widget,
            show_main_window,
        ])
        .setup(|app| {
            // Build system tray menu
            let show_item = MenuItem::with_id(app, "show", "Show Vukixxx", true, None::<&str>)?;
            let widget_item = MenuItem::with_id(app, "widget", "Toggle Widget", true, None::<&str>)?;
            let settings_item = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show_item, &widget_item, &settings_item, &quit_item])?;

            TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("Vukixxx - AI Context Workbench")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "widget" => {
                        if let Some(widget) = app.get_webview_window("widget") {
                            if widget.is_visible().unwrap_or(false) {
                                let _ = widget.hide();
                            } else {
                                let _ = widget.show();
                                let _ = widget.set_focus();
                            }
                        }
                    }
                    "settings" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.eval("window.__TAURI_NAVIGATE__('settings')");
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            // Initialize prompts directory
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let _ = commands::filesystem::ensure_prompts_dir_internal(&app_handle).await;
            });

            // Register global keyboard shortcut for widget toggle
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutEvent, ShortcutState};

            // --- Ctrl+Shift+V: Copy Widget ---
            let shortcut = "Ctrl+Shift+V".parse::<Shortcut>()
                .map_err(|e| format!("Failed to parse shortcut: {}", e))?;

            // Unregister first (in case of hot reload or restart)
            let _ = app.global_shortcut().unregister(shortcut);

            let app_handle_shortcut = app.handle().clone();
            match app.global_shortcut().on_shortcut(shortcut, move |_app: &tauri::AppHandle, _sc: &Shortcut, e: ShortcutEvent| {
                if e.state == ShortcutState::Pressed {
                    if let Some(widget) = app_handle_shortcut.get_webview_window("widget") {
                        let is_visible = widget.is_visible().unwrap_or(false);
                        if is_visible {
                            let _ = widget.hide();
                        } else {
                            let _ = widget.show();
                            let _ = widget.set_focus();
                        }
                    }
                }
            }) {
                Ok(_) => println!("Global shortcut Ctrl+Shift+V registered successfully"),
                Err(e) => println!("Warning: Failed to register Ctrl+Shift+V: {}", e),
            }

            // --- Ctrl+Shift+B: Save Widget ---
            let save_shortcut = "Ctrl+Shift+B".parse::<Shortcut>()
                .map_err(|e| format!("Failed to parse save shortcut: {}", e))?;

            let _ = app.global_shortcut().unregister(save_shortcut);

            let app_handle_save = app.handle().clone();
            match app.global_shortcut().on_shortcut(save_shortcut, move |_app: &tauri::AppHandle, _sc: &Shortcut, e: ShortcutEvent| {
                if e.state == ShortcutState::Pressed {
                    if let Some(widget) = app_handle_save.get_webview_window("save-widget") {
                        let is_visible = widget.is_visible().unwrap_or(false);
                        if is_visible {
                            let _ = widget.hide();
                        } else {
                            let _ = widget.show();
                            let _ = widget.set_focus();
                        }
                    }
                }
            }) {
                Ok(_) => println!("Global shortcut Ctrl+Shift+B registered successfully"),
                Err(e) => println!("Warning: Failed to register Ctrl+Shift+B: {}", e),
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Vukixxx");
}
