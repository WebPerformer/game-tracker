#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use sysinfo::{ProcessExt, System, SystemExt};
use serde::Serialize;
use tauri::{
    command,
    Manager, 
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    WindowEvent,
};
use std::process::Command;

#[derive(Serialize)]
struct ProcessInfo {
    name: String,
    running: bool,
}

#[tauri::command]
fn list_app_processes() -> Vec<ProcessInfo> {
    let mut system = System::new_all();
    system.refresh_all();

    system
        .processes()
        .iter()
        .filter_map(|(_, process)| {
            if process.name().ends_with(".exe") {
                Some(ProcessInfo {
                    name: process.name().to_string(),
                    running: true,
                })
            } else {
                None
            }
        })
        .collect()
}

#[command]
fn execute_process(process_path: String) -> Result<String, String> {
    let parent_dir = std::path::Path::new(&process_path)
        .parent()
        .ok_or("Não foi possível obter o diretório do executável")?;

    let command = Command::new(&process_path)
        .current_dir(parent_dir) // Define o diretório de trabalho
        .spawn(); // Executa o processo de forma assíncrona

    match command {
        Err(error) => Err(format!("Erro ao iniciar o processo: {:?}", error)),
    }
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    tauri::Builder::default()
        .setup(|app| {
           // Menu do botão direito no Tray
           let quit_item = MenuItem::with_id(app, "quit", "Fechar", true, None::<&str>)?;
           let open_item = MenuItem::with_id(app, "show", "Abrir Janela", true, None::<&str>)?;
           let right_click_menu = Menu::with_items(app, &[&open_item, &quit_item])?;

           // Criação do ícone do Tray
           let _tray = TrayIconBuilder::new()
               .icon(app.default_window_icon().unwrap().clone())
               .menu(&right_click_menu)
               .show_menu_on_left_click(false)
               .build(app)?;

            #[cfg(desktop)]
            {
                use tauri_plugin_autostart::MacosLauncher;
                use tauri_plugin_autostart::ManagerExt;

                let _ = app.handle().plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    Some(vec!["--flag1", "--flag2"]),
                ));

                // Get the autostart manager
                let autostart_manager = app.autolaunch();
                // Enable autostart
                let _ = autostart_manager.enable();
                // Check enable state
                println!("registered for autostart? {}", autostart_manager.is_enabled().unwrap());
                // Disable autostart
                let _ = autostart_manager.disable();
            }
            
            Ok(())
        })

        // Evento do Tray Icon
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        })
        // Evento de Menu no Tray
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                println!("Fechando aplicação pelo menu");
                app.exit(0);
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        })
        // Evento para minimizar diretamente para o Tray
        .on_window_event(|app, event| {
            let window = app.get_webview_window("main").unwrap(); // Obtém a janela pelo ID
            if let WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap(); // Esconde a janela
                api.prevent_close(); // Impede que a janela feche
            }
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![list_app_processes, execute_process])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
