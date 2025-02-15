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
    first_release_date: Option<i32>,
    summary: Option<String>,
    screenshots: Option<Vec<Screenshot>>,
    genres: Option<Vec<i32>>,
    genre_names: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Serialize)]
struct Genre {
    id: i32,
    name: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct Cover {
    id: i32,
    image_id: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct Screenshot {
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
    use std::collections::HashMap;
    dotenv().ok();

    let client_id = env::var("IGDB_CLIENT_ID").expect("Client ID not found");
    let client_secret = env::var("IGDB_CLIENT_SECRET").expect("Client Secret not found");
    let grant_type = "client_credentials".to_string();

    let client = reqwest::Client::new();
    let token_url = "https://id.twitch.tv/oauth2/token";
    let game_search_url = "https://api.igdb.com/v4/games";
    let genre_search_url = "https://api.igdb.com/v4/genres";

    // Obtém o token de acesso
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

    // Requisição para buscar os jogos
    let body = format!(
        "search \"{}\"; fields id, name, cover.image_id, first_release_date, summary, screenshots.image_id, genres; limit 10;",
        query
    );

    let response = client.post(game_search_url)
        .headers(headers.clone())
        .body(body)
        .send()
        .await
        .map_err(|e| format!("Erro ao buscar jogos: {}", e))?;

    let response_body = response.text().await.map_err(|e| format!("Erro ao ler resposta: {}", e))?;
    println!("Response body: {}", response_body);

    let mut games: Vec<Game> = serde_json::from_str(&response_body)
        .map_err(|e| format!("Erro ao processar resposta: {}", e))?;

    // Coletar todos os IDs de gênero para evitar requisições desnecessárias
    let mut genre_ids = std::collections::HashSet::new();
    for game in &games {
        if let Some(genres) = &game.genres {
            genre_ids.extend(genres.iter());
        }
    }

    // Se houver gêneros, buscar seus nomes
    let genre_names_map = if !genre_ids.is_empty() {
        let genre_body = format!(
            "fields id, name; where id = ({}) ;",
            genre_ids.iter().map(|id: &i32| id.to_string()).collect::<Vec<String>>().join(",")
        );

        let genre_response = client.post(genre_search_url)
            .headers(headers)
            .body(genre_body)
            .send()
            .await
            .map_err(|e| format!("Erro ao buscar gêneros: {}", e))?;

        let genre_response_body = genre_response.text().await.map_err(|e| format!("Erro ao ler resposta dos gêneros: {}", e))?;
        println!("Genres response body: {}", genre_response_body);

        let genre_list: Vec<Genre> = serde_json::from_str(&genre_response_body)
            .map_err(|e| format!("Erro ao processar resposta dos gêneros: {}", e))?;

        genre_list.into_iter().map(|g| (g.id, g.name)).collect::<HashMap<_, _>>()
    } else {
        HashMap::new()
    };

    // Substituir IDs dos gêneros pelos nomes nos jogos
    for game in &mut games {
        if let Some(genres) = &game.genres {
            game.genre_names = Some(
                genres.iter()
                    .filter_map(|id| genre_names_map.get(id).cloned())
                    .collect()
            );
        }
    }

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
