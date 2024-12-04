// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use pandoc_wasm_wrapper::pandoc;
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
async fn init_pandoc() {
    let args: Vec<String> = vec!["--version".to_string()];
    let input_bytes = vec![];
    let _ = pandoc(&args, &input_bytes);
}

fn docx_to_md(path: &str) -> Result<String, Box<dyn std::error::Error>> {
    let args: Vec<String> = vec!["--from=docx".to_string(), "--to=markdown".to_string()];
    let input_bytes = std::fs::read(&path)?;
    pandoc(&args, &input_bytes)
}

fn get_plain_text(path: &str) -> String {
    std::fs::read_to_string(&path).unwrap()
}

#[tauri::command]
fn get_file(path: String) -> String {
    let extention = path.split('.').last().unwrap();
    match extention {
        "docx" => docx_to_md(&path).unwrap(),
        "md" | "txt" | "csv" | "json" => get_plain_text(&path),
        _ => "Unsupported file type".to_string(),
    }
}

fn main() {
    let migrations = vec![
        // Define your migrations here
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    path TEXT UNIQUE, 
                    data JSON -- TODO: depth INTEGER GENERATED ALWAYS AS (LENGTH(path) - LENGTH(REPLACE(path, '.', '')) + 1) STORED
                );
                CREATE INDEX idx_messages_path ON messages(path);
                -- TODO: CREATE INDEX idx_nodes_depth ON nodes(depth);

                CREATE VIEW message_view AS SELECT 
                    id, 
                    path, 
                    json_extract(data, '$.message') AS message 
                FROM
                    messages;

                CREATE VIRTUAL TABLE messages_fts USING fts5(
                    id UNINDEXED, path UNINDEXED, message, 
                    tokenize = 'trigram', content = 'message_view', 
                    content_rowid = 'id'
                );

                -- Trigger for INSERT
                CREATE TRIGGER message_insert AFTER INSERT ON messages
                BEGIN
                    INSERT INTO messages_fts (id, path, message) SELECT NEW.id, NEW.path, json_extract(NEW.data, '$.message');
                END;

                -- Trigger for DELETE
                CREATE TRIGGER messages_delete AFTER DELETE ON messages
                BEGIN
                    DELETE FROM messages_fts WHERE id = OLD.id;
                END;

                -- Trigger for UPDATE
                CREATE TRIGGER messages_update AFTER UPDATE ON messages
                BEGIN
                    DELETE FROM messages_fts WHERE id = OLD.id;
                    INSERT INTO messages_fts (id, path, message) SELECT NEW.id, NEW.path, json_extract(NEW.data, '$.message');
                END;

                CREATE TABLE providers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    name TEXT NOT NULL, endpoint TEXT NOT NULL, 
                    apiKey TEXT NOT NULL
                );

                CREATE TABLE models (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    name TEXT NOT NULL, 
                    model TEXT NOT NULL, 
                    providerId INTEGER NOT NULL, 
                    FOREIGN KEY (providerId) REFERENCES providers(id)
                );
            ",
            kind: MigrationKind::Up,
        },
    ];
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mammal.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_cors_fetch::init())
        .invoke_handler(tauri::generate_handler![init_pandoc, get_file])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window
                .set_size(tauri::Size::Logical(tauri::LogicalSize {
                    width: 1000.0,
                    height: 600.0,
                }))
                .unwrap();
            Ok(())
        });
    app.run(tauri::generate_context!())
        .expect("error while running tauri application");
}
