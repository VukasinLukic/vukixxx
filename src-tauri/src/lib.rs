mod commands;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::init())
        .invoke_handler(tauri::generate_handler![
            commands::filesystem::read_prompts_dir,
            commands::filesystem::read_prompt_file,
            commands::filesystem::write_prompt_file,
            commands::filesystem::delete_prompt_file,
            commands::filesystem::ensure_prompts_dir,
            commands::settings::load_settings,
            commands::settings::save_settings,
            commands::watcher::start_watcher,
            commands::watcher::stop_watcher,
        ])
        .setup(|app| {
            // Build system tray menu
            let show_item = MenuItem::with_id(app, "show", "Show Vukixxx", true, None::<&str>)?;
            let settings_item = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show_item, &settings_item, &quit_item])?;

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

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Vukixxx");
}
