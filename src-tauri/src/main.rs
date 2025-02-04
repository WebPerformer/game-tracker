#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};
use dotenv::dotenv;
use tauri_plugin_http::init as HttpPlugin;
use sysinfo::{ProcessExt, System, SystemExt};
use serde::{Deserialize, Serialize};
use tauri::{
    command,
    Manager, 
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    WindowEvent,
};
use std::{process::Command, env};

#[derive(Debug, Deserialize, Serialize)]
struct Game {
    id: i32,
    name: String,
    cover: Option<Cover>,
}

#[derive(Debug, Deserialize, Serialize)]
struct Cover {
    id: i32,
    image_id: String,
}

#[derive(Serialize)]
struct ProcessInfo {
    name: String,
    running: bool,
}

#[command]
async fn search_games(query: String) -> Result<Vec<Game>, String> {
    dotenv().ok();

    let client_id = env::var("IGDB_CLIENT_ID").expect("Client ID not found");
    let client_secret = env::var("IGDB_CLIENT_SECRET").expect("Client Secret not found");
    let grant_type = "client_credentials".to_string();

    let client = reqwest::Client::new();
    let token_url = "https://id.twitch.tv/oauth2/token";
    let game_search_url = "https://api.igdb.com/v4/games";

    let token_res = client.post(token_url)
        .form(&[ 
            ("client_id", &client_id),
            ("client_secret", &client_secret),
            ("grant_type", &grant_type),
        ])
        .send()
        .await
        .map_err(|e| format!("Erro ao obter token: {}", e))?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Erro ao processar resposta do token: {}", e))?;

    let access_token = token_res["access_token"].as_str().ok_or("Token não encontrado")?;

    let mut headers = HeaderMap::new();
    headers.insert("Client-ID", HeaderValue::from_str(&client_id).unwrap());
    headers.insert(AUTHORIZATION, HeaderValue::from_str(&format!("Bearer {}", access_token)).unwrap());
    headers.insert("Content-Type", HeaderValue::from_static("application/json"));

    let body = format!(
        "search \"{}\"; fields id, name, cover.image_id; limit 10;",
        query
    );

    let response = client.post(game_search_url)
        .headers(headers)
        .body(body)
        .send()
        .await
        .map_err(|e| format!("Erro ao buscar jogos: {}", e))?;

    let response_body = response.text().await.map_err(|e| format!("Erro ao ler resposta: {}", e))?;
    println!("Response body: {}", response_body);

    let games: Vec<Game> = serde_json::from_str(&response_body).map_err(|e| format!("Erro ao processar resposta: {}", e))?;

    Ok(games)
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

    Command::new(&process_path)
        .current_dir(parent_dir)
        .spawn()
        .map_err(|error| format!("Erro ao iniciar o processo: {:?}", error))?;

    Ok("Processo iniciado com sucesso".to_string())
}

#[tauri::command]
fn check_if_file_exists(path: String) -> bool {
    std::path::Path::new(&path).exists()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    tauri::Builder::default()
        .setup(|app| {
           let quit_item = MenuItem::with_id(app, "quit", "Fechar", true, None::<&str>)?;
           let open_item = MenuItem::with_id(app, "show", "Abrir Janela", true, None::<&str>)?;
           let right_click_menu = Menu::with_items(app, &[&open_item, &quit_item])?;

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

                let autostart_manager = app.autolaunch();
                let _ = autostart_manager.enable();
                println!("registered for autostart? {}", autostart_manager.is_enabled().unwrap());
                let _ = autostart_manager.disable();
            }
            
            Ok(())
        })

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
        .on_window_event(|app, event| {
            let window = app.get_webview_window("main").unwrap();
            if let WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(HttpPlugin())
        .invoke_handler(tauri::generate_handler![list_app_processes, execute_process, check_if_file_exists, search_games])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
