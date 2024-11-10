#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};
// Prevents additional console window on Windows in release, DO NOT REMOVE!!

// messages table id will be like 123.123.142
// so we will be doing selects like "SELECT * FROM messages WHERE id LIKE '123.123.%'"
// so we need to create an index for the id column
// CREATE INDEX id_index ON messages (id);
// we also want an fts5 table for the message column
// CREATE VIRTUAL TABLE messages_fts USING fts5(id, role, name, message, metadata, content='messages', content_rowid='id');

fn main() {
    let migrations = vec![
        // Define your migrations here
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY,
                treeId TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL,
                name TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                message TEXT,
                metadata TEXT
            );
            CREATE INDEX id_index ON messages (treeId);
            CREATE VIRTUAL TABLE messages_fts USING fts5(message, content='messages', content_rowid='id');

            -- Trigger for INSERT
            CREATE TRIGGER messages_ai AFTER INSERT ON messages BEGIN
                INSERT INTO messages_fts(rowid, message) VALUES (new.id, new.message);
            END;

            -- Trigger for DELETE
            CREATE TRIGGER messages_ad AFTER DELETE ON messages BEGIN
                INSERT INTO messages_fts(messages_fts, rowid, message) VALUES('delete', old.id, old.message);
            END;

            -- Trigger for UPDATE
            CREATE TRIGGER messages_au AFTER UPDATE ON messages BEGIN
                INSERT INTO messages_fts(messages_fts, rowid, message) VALUES('delete', old.id, old.message);
                INSERT INTO messages_fts(rowid, message) VALUES (new.id, new.message);
            END;

            CREATE TABLE IF NOT EXISTS providers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                endpoint TEXT NOT NULL,
                apiKey TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS models (
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
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mammal.db", migrations)
                .build(),
        )
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.set_size(tauri::Size::Logical(tauri::LogicalSize {
                width: 1000.0,
                height: 600.0,
            })).unwrap();
            Ok(())
        });
    app.run(tauri::generate_context!())
        .expect("error while running tauri application");
}
