#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sysinfo::{ProcessExt, System, SystemExt};

#[tauri::command]
fn list_app_processes() -> Vec<String> {
    let mut system = System::new_all();
    system.refresh_all();

    system
        .processes()
        .iter()
        .filter_map(|(_, process)| {
            // Filtra apenas os processos visíveis com janelas (indicativo de aplicativos)
            if process.name().ends_with(".exe") {
                Some(process.name().to_string())
            } else {
                None
            }
        })
        .collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![list_app_processes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
