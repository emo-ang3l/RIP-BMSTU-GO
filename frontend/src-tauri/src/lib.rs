// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            
            // Открываем devtools в production build для отладки
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }
            
            Ok(())
        }).plugin(tauri_plugin_cors_fetch::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}