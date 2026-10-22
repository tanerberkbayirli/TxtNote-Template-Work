use std::collections::HashSet;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use rusqlite::{params, params_from_iter, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use tauri::{AppHandle, Manager};

const SCHEMA_VERSION: i64 = 2;

const SCHEMA: &str = r#"
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;
PRAGMA cache_size = -20000;
PRAGMA mmap_size = 67108864;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  parent_id TEXT,
  name TEXT NOT NULL DEFAULT '',
  item_kind TEXT NOT NULL DEFAULT 'document',
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL,
  data TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  file_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  data TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (file_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS trash (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  deleted_at INTEGER NOT NULL,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS note_versions (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  hash TEXT NOT NULL,
  data TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_note_versions_note
  ON note_versions (note_id, created_at DESC);

CREATE TABLE IF NOT EXISTS kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quarantine (
  table_name TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  reason TEXT NOT NULL,
  quarantined_at INTEGER NOT NULL,
  PRIMARY KEY (table_name, id)
);
"#;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    #[serde(default)]
    pub workspaces: Vec<Value>,
    #[serde(default)]
    pub items: Vec<Value>,
    #[serde(default)]
    pub trash: Vec<Value>,
    #[serde(default)]
    pub notes: Map<String, Value>,
    #[serde(default = "default_trash_enabled")]
    pub trash_enabled: bool,
    #[serde(default = "default_json_object")]
    pub session: Value,
    #[serde(default = "default_json_object")]
    pub profile: Value,
}

fn default_trash_enabled() -> bool {
    true
}

fn default_json_object() -> Value {
    json!({})
}

impl Default for Snapshot {
    fn default() -> Self {
        Self {
            workspaces: Vec::new(),
            items: Vec::new(),
            trash: Vec::new(),
            notes: Map::new(),
            trash_enabled: true,
            session: json!({}),
            profile: json!({}),
        }
    }
}

pub struct AppDb {
    dir: PathBuf,
    conn: Mutex<Option<Connection>>,
}

impl AppDb {
    pub fn pending(app: &AppHandle) -> Result<Self, String> {
        let dir = app
            .path()
            .app_data_dir()
            .map_err(|error| error.to_string())?;
        Ok(Self {
            dir,
            conn: Mutex::new(None),
        })
    }

    pub fn warmup(&self) -> Result<(), String> {
        self.with_conn(|_| Ok(()))
    }

    fn media_dir(&self) -> PathBuf {
        self.dir.join("media")
    }

    fn open_conn(&self) -> Result<Connection, String> {
        fs::create_dir_all(self.media_dir()).map_err(|error| error.to_string())?;
        let conn = Connection::open(self.dir.join("txtnote.sqlite"))
            .map_err(|error| error.to_string())?;
        conn.execute_batch(SCHEMA)
            .map_err(|error| error.to_string())?;
        migrate_schema(&conn)?;
        Ok(conn)
    }

    fn with_conn<T>(&self, work: impl FnOnce(&Connection) -> Result<T, String>) -> Result<T, String> {
        let mut guard = self.conn.lock().map_err(|error| error.to_string())?;
        if guard.is_none() {
            *guard = Some(self.open_conn()?);
        }
        let conn = guard
            .as_ref()
            .ok_or_else(|| "veritabanı açılamadı".to_string())?;
        work(conn)
    }
}

async fn spawn_db<T, F>(app: AppHandle, work: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce(&AppDb) -> Result<T, String> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(move || {
        let db = app.state::<AppDb>();
        work(&db)
    })
    .await
    .map_err(|error| error.to_string())?
}

#[allow(dead_code)]
fn query_json_rows(conn: &Connection, sql: &str) -> Result<Vec<Value>, String> {
    let mut stmt = conn.prepare(sql).map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|error| error.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        let raw = row.map_err(|error| error.to_string())?;
        out.push(serde_json::from_str(&raw).map_err(|error| error.to_string())?);
    }
    Ok(out)
}

fn kv_get(conn: &Connection, key: &str, fallback: Value) -> Result<Value, String> {
    let raw: Option<String> = conn
        .query_row("SELECT value FROM kv WHERE key = ?1", params![key], |row| {
            row.get(0)
        })
        .optional()
        .map_err(|error| error.to_string())?;
    match raw {
        Some(value) => serde_json::from_str(&value).map_err(|error| error.to_string()),
        None => Ok(fallback),
    }
}

fn kv_set(conn: &Connection, key: &str, value: &Value) -> Result<(), String> {
    conn.execute(
        "INSERT INTO kv (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value.to_string()],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

fn is_wallet_address(value: &str) -> bool {
    value.len() == 42
        && value.starts_with("0x")
        && value[2..].bytes().all(|byte| byte.is_ascii_hexdigit())
}

fn load_db_owner_inner(conn: &Connection) -> Result<Option<Value>, String> {
    let value = kv_get(conn, "db_owner", Value::Null)?;
    if value.is_null() {
        Ok(None)
    } else {
        Ok(Some(value))
    }
}

fn bind_db_owner_inner(conn: &Connection, owner: &Value) -> Result<Value, String> {
    let address = owner
        .get("walletAddress")
        .and_then(Value::as_str)
        .ok_or_else(|| "geçersiz cüzdan adresi".to_string())?;
    if !is_wallet_address(address) {
        return Err("geçersiz cüzdan adresi".to_string());
    }
    let replace = owner
        .get("replace")
        .and_then(Value::as_bool)
        .unwrap_or(false);
    let mut stored = owner.clone();
    if let Some(object) = stored.as_object_mut() {
        object.remove("replace");
    }
    if let Some(existing) = load_db_owner_inner(conn)? {
        if let Some(existing_addr) = existing.get("walletAddress").and_then(Value::as_str) {
            if !existing_addr.eq_ignore_ascii_case(address) {
                if !replace {
                    return Err("veritabanı başka bir cüzdana bağlı".to_string());
                }
                kv_set(conn, "db_owner", &stored)?;
                return Ok(stored);
            }
        }
        let mut merged = existing.clone();
        let mut dirty = false;
        if let Some(object) = merged.as_object_mut() {
            for key in ["ownershipProof", "publicKey", "walletProvider"] {
                let missing = object
                    .get(key)
                    .and_then(Value::as_str)
                    .filter(|value| !value.is_empty())
                    .is_none();
                if missing {
                    if let Some(value) = stored.get(key) {
                        object.insert(key.into(), value.clone());
                        dirty = true;
                    }
                }
            }
        }
        if dirty {
            kv_set(conn, "db_owner", &merged)?;
        }
        return Ok(merged);
    }
    kv_set(conn, "db_owner", &stored)?;
    Ok(stored)
}

fn sync_db_owner_from_profile(conn: &Connection, profile: &Value) -> Result<(), String> {
    let Some(address) = profile
        .get("walletAddress")
        .and_then(Value::as_str)
        .filter(|value| is_wallet_address(value))
    else {
        return Ok(());
    };
    if let Some(existing) = load_db_owner_inner(conn)? {
        if let Some(existing_addr) = existing.get("walletAddress").and_then(Value::as_str) {
            if !existing_addr.eq_ignore_ascii_case(address) {
                // Profile is not allowed to steal the database from the bound wallet.
                return Ok(());
            }
        }
    }
    let mut owner = json!({
        "walletAddress": address,
        "boundAt": now_millis(),
    });
    if let Some(provider) = profile.get("walletProvider") {
        owner["walletProvider"] = provider.clone();
    }
    bind_db_owner_inner(conn, &owner)?;
    Ok(())
}

fn attach_media_paths(conn: &Connection, items: &mut [Value]) -> Result<(), String> {
    let mut media_stmt = conn
        .prepare("SELECT id, path FROM media")
        .map_err(|error| error.to_string())?;
    let media_rows = media_stmt
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
        .map_err(|error| error.to_string())?;
    let mut media = Map::new();
    for row in media_rows {
        let (id, path) = row.map_err(|error| error.to_string())?;
        media.insert(id, Value::String(path));
    }
    for item in items {
        let Some(id) = item.get("id").and_then(Value::as_str) else {
            continue;
        };
        let Some(path) = media.get(id).and_then(Value::as_str) else {
            continue;
        };
        item.as_object_mut()
            .ok_or_else(|| "item JSON object expected".to_string())?
            .insert("mediaPath".into(), json!(path));
    }
    Ok(())
}

fn load_workspaces(conn: &Connection) -> Result<Vec<Value>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, COALESCE(name, ''), CAST(COALESCE(created_at, 0) AS INTEGER), CAST(COALESCE(updated_at, 0) AS INTEGER),
                    COALESCE(data, '') FROM workspaces ORDER BY sort_order, rowid",
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, i64>(3)?,
                row.get::<_, String>(4)?,
            ))
        })
        .map_err(|error| error.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        let (id, name, created_at, updated_at, raw) = match row {
            Ok(value) => value,
            Err(error) => {
                eprintln!("TxtNote çalışma alanı satırı okunamadı: {error}");
                continue;
            }
        };
        let raw = readable_data(conn, "workspaces", &id, &raw);
        match hydrate_workspace(&id, &name, created_at, updated_at, &raw) {
            Ok(value) => out.push(value),
            Err(error) => eprintln!("TxtNote çalışma alanı çözülemedi ({id}): {error}"),
        }
    }
    Ok(out)
}

fn load_items(conn: &Connection) -> Result<Vec<Value>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, COALESCE(workspace_id, ''), parent_id, COALESCE(name, ''), COALESCE(item_kind, 'document'),
                    CAST(COALESCE(created_at, 0) AS INTEGER), CAST(COALESCE(updated_at, 0) AS INTEGER), COALESCE(data, '')
             FROM items ORDER BY sort_order, rowid",
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, i64>(5)?,
                row.get::<_, i64>(6)?,
                row.get::<_, String>(7)?,
            ))
        })
        .map_err(|error| error.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        let (id, workspace_id, parent_id, name, item_kind, created_at, updated_at, raw) = match row {
            Ok(value) => value,
            Err(error) => {
                eprintln!("TxtNote öğe satırı okunamadı: {error}");
                continue;
            }
        };
        let raw = readable_data(conn, "items", &id, &raw);
        match hydrate_item(
            &id,
            &workspace_id,
            parent_id.as_deref(),
            &name,
            &item_kind,
            created_at,
            updated_at,
            &raw,
        ) {
            Ok(value) => out.push(value),
            Err(error) => eprintln!("TxtNote öğe çözülemedi ({id}): {error}"),
        }
    }
    Ok(out)
}

fn load_trash_rows(conn: &Connection) -> Result<Vec<Value>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, workspace_id, CAST(COALESCE(deleted_at, 0) AS INTEGER), COALESCE(data, '')
             FROM trash ORDER BY deleted_at DESC, rowid",
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, String>(3)?,
            ))
        })
        .map_err(|error| error.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        let (id, workspace_id, deleted_at, raw) = match row {
            Ok(value) => value,
            Err(error) => {
                eprintln!("TxtNote çöp satırı okunamadı: {error}");
                continue;
            }
        };
        let raw = readable_data(conn, "trash", &id, &raw);
        match hydrate_trash(&id, workspace_id.as_deref(), deleted_at, &raw) {
            Ok(value) => out.push(value),
            Err(error) => eprintln!("TxtNote çöp çözülemedi ({id}): {error}"),
        }
    }
    Ok(out)
}

fn load_shell_inner(conn: &Connection) -> Result<Snapshot, String> {
    let mut items = load_items(conn)?;
    attach_media_paths(conn, &mut items)?;

    let trash_enabled = match kv_get(conn, "trash_enabled", json!(true))? {
        Value::Bool(value) => value,
        other => other.as_bool().unwrap_or(true),
    };

    Ok(Snapshot {
        workspaces: load_workspaces(conn)?,
        items,
        trash: load_trash_rows(conn)?,
        notes: Map::new(),
        trash_enabled,
        session: kv_get(conn, "session", json!({}))?,
        profile: kv_get(conn, "profile", json!({}))?,
    })
}

fn read_note_row(
    conn: &Connection,
    id: String,
    workspace_id: Option<String>,
    file_id: Option<String>,
    title: String,
    content: String,
    created_at: i64,
    updated_at: i64,
    revision: i64,
    raw: String,
) -> Result<(String, Value), String> {
    let raw = readable_data(conn, "notes", &id, &raw);
    let note = hydrate_note(
        &id,
        workspace_id.as_deref(),
        file_id.as_deref(),
        &title,
        &content,
        created_at,
        updated_at,
        revision,
        &raw,
    )?;
    Ok((id, note))
}

fn load_notes_inner(conn: &Connection, ids: Option<&[String]>) -> Result<Map<String, Value>, String> {
    let mut map = Map::new();
    const NOTE_COLS: &str = "id, workspace_id, file_id, COALESCE(title, ''), COALESCE(content, ''),
        CAST(COALESCE(created_at, 0) AS INTEGER), CAST(COALESCE(updated_at, 0) AS INTEGER),
        CAST(COALESCE(revision, 1) AS INTEGER), COALESCE(data, '')";
    if let Some(ids) = ids {
        if ids.is_empty() {
            return Ok(map);
        }
        let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        let sql = format!("SELECT {NOTE_COLS} FROM notes WHERE id IN ({placeholders})");
        let mut stmt = conn.prepare(&sql).map_err(|error| error.to_string())?;
        let mut rows = stmt
            .query(params_from_iter(ids.iter()))
            .map_err(|error| error.to_string())?;
        while let Some(row) = rows.next().map_err(|error| error.to_string())? {
            // One unreadable row never fails the others (HE-VB-02).
            let fields = (|| -> rusqlite::Result<_> {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?, row.get(6)?, row.get(7)?, row.get(8)?))
            })();
            let (id, workspace_id, file_id, title, content, created_at, updated_at, revision, raw) = match fields {
                Ok(value) => value,
                Err(error) => {
                    eprintln!("TxtNote not satırı okunamadı: {error}");
                    continue;
                }
            };
            match read_note_row(conn, id, workspace_id, file_id, title, content, created_at, updated_at, revision, raw) {
                Ok((id, note)) => {
                    map.insert(id, note);
                }
                Err(error) => eprintln!("TxtNote not çözülemedi: {error}"),
            }
        }
        return Ok(map);
    }

    let mut stmt = conn
        .prepare(&format!("SELECT {NOTE_COLS} FROM notes"))
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, i64>(5)?,
                row.get::<_, i64>(6)?,
                row.get::<_, i64>(7)?,
                row.get::<_, String>(8)?,
            ))
        })
        .map_err(|error| error.to_string())?;
    for row in rows {
        let (id, workspace_id, file_id, title, content, created_at, updated_at, revision, raw) = match row {
            Ok(value) => value,
            Err(error) => {
                eprintln!("TxtNote not satırı okunamadı: {error}");
                continue;
            }
        };
        match read_note_row(conn, id, workspace_id, file_id, title, content, created_at, updated_at, revision, raw) {
            Ok((id, note)) => {
                map.insert(id, note);
            }
            Err(error) => eprintln!("TxtNote not çözülemedi: {error}"),
        }
    }
    Ok(map)
}

fn load_snapshot_inner(conn: &Connection) -> Result<Snapshot, String> {
    let mut snapshot = load_shell_inner(conn)?;
    snapshot.notes = load_notes_inner(conn, None)?;
    Ok(snapshot)
}

fn now_millis() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

fn table_columns(conn: &Connection, table: &str) -> Result<HashSet<String>, String> {
    let mut stmt = conn
        .prepare(&format!("PRAGMA table_info({table})"))
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|error| error.to_string())?;
    let mut out = HashSet::new();
    for row in rows {
        out.insert(row.map_err(|error| error.to_string())?);
    }
    Ok(out)
}

fn ensure_column(conn: &Connection, table: &str, column: &str, decl: &str) -> Result<(), String> {
    if table_columns(conn, table)?.contains(column) {
        return Ok(());
    }
    conn.execute(&format!("ALTER TABLE {table} ADD COLUMN {column} {decl}"), [])
        .map_err(|error| error.to_string())?;
    Ok(())
}

fn migrate_schema(conn: &Connection) -> Result<(), String> {
    ensure_column(conn, "workspaces", "name", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "workspaces", "created_at", "INTEGER NOT NULL DEFAULT 0")?;
    ensure_column(conn, "workspaces", "updated_at", "INTEGER NOT NULL DEFAULT 0")?;

    ensure_column(conn, "items", "parent_id", "TEXT")?;
    ensure_column(conn, "items", "name", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "items", "item_kind", "TEXT NOT NULL DEFAULT 'document'")?;
    ensure_column(conn, "items", "created_at", "INTEGER NOT NULL DEFAULT 0")?;
    ensure_column(conn, "items", "updated_at", "INTEGER NOT NULL DEFAULT 0")?;

    ensure_column(conn, "notes", "workspace_id", "TEXT")?;
    ensure_column(conn, "notes", "file_id", "TEXT")?;
    ensure_column(conn, "notes", "title", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "notes", "content", "TEXT NOT NULL DEFAULT ''")?;
    ensure_column(conn, "notes", "created_at", "INTEGER NOT NULL DEFAULT 0")?;
    ensure_column(conn, "notes", "revision", "INTEGER NOT NULL DEFAULT 1")?;

    ensure_column(conn, "trash", "workspace_id", "TEXT")?;

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS note_versions (
          id TEXT PRIMARY KEY,
          note_id TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          hash TEXT NOT NULL,
          data TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS media (
          id TEXT PRIMARY KEY,
          mime TEXT NOT NULL,
          path TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_items_workspace ON items (workspace_id);
        CREATE INDEX IF NOT EXISTS idx_items_parent ON items (parent_id);
        CREATE INDEX IF NOT EXISTS idx_notes_workspace ON notes (workspace_id);
        CREATE INDEX IF NOT EXISTS idx_notes_file ON notes (file_id);
        CREATE INDEX IF NOT EXISTS idx_note_versions_note
          ON note_versions (note_id, created_at DESC);
        ",
    )
    .map_err(|error| error.to_string())?;

    let now = now_millis();
    conn.execute(
        "UPDATE workspaces SET
            name = COALESCE(NULLIF(name, ''), json_extract(data, '$.name'), ''),
            created_at = CASE
                WHEN created_at > 0 THEN created_at
                ELSE COALESCE(CAST(json_extract(data, '$.createdAt') AS INTEGER), ?1)
            END,
            updated_at = CASE
                WHEN updated_at > 0 THEN updated_at
                ELSE COALESCE(CAST(json_extract(data, '$.updatedAt') AS INTEGER), created_at, ?1)
            END",
        params![now],
    )
    .map_err(|error| error.to_string())?;

    conn.execute(
        "UPDATE items SET
            name = COALESCE(NULLIF(name, ''), json_extract(data, '$.title'), json_extract(data, '$.name'), ''),
            item_kind = COALESCE(NULLIF(item_kind, 'document'), json_extract(data, '$.type'), item_kind, 'document'),
            parent_id = COALESCE(parent_id, json_extract(data, '$.parentId')),
            created_at = CASE
                WHEN created_at > 0 THEN created_at
                ELSE COALESCE(CAST(json_extract(data, '$.createdAt') AS INTEGER), ?1)
            END,
            updated_at = CASE
                WHEN updated_at > 0 THEN updated_at
                ELSE COALESCE(CAST(json_extract(data, '$.updatedAt') AS INTEGER), created_at, ?1)
            END",
        params![now],
    )
    .map_err(|error| error.to_string())?;
    conn.execute("UPDATE items SET parent_id = NULL WHERE parent_id = ''", [])
        .map_err(|error| error.to_string())?;

    conn.execute(
        "UPDATE notes SET
            title = COALESCE(NULLIF(title, ''), json_extract(data, '$.title'), ''),
            content = COALESCE(NULLIF(content, ''), json_extract(data, '$.content'), ''),
            workspace_id = COALESCE(
                NULLIF(workspace_id, ''),
                (SELECT workspace_id FROM items WHERE items.id = notes.id),
                (SELECT workspace_id FROM trash WHERE trash.id = notes.id),
                json_extract(data, '$.workspaceId')
            ),
            file_id = COALESCE(
                file_id,
                (SELECT parent_id FROM items WHERE items.id = notes.id),
                json_extract(data, '$.fileId'),
                json_extract(data, '$.parentId')
            ),
            created_at = CASE
                WHEN created_at > 0 THEN created_at
                ELSE COALESCE(CAST(json_extract(data, '$.createdAt') AS INTEGER), updated_at, ?1)
            END,
            revision = CASE
                WHEN revision >= 1 THEN revision
                ELSE COALESCE(CAST(json_extract(data, '$.revision') AS INTEGER), 1)
            END",
        params![now],
    )
    .map_err(|error| error.to_string())?;
    conn.execute("UPDATE notes SET file_id = NULL WHERE file_id = ''", [])
        .map_err(|error| error.to_string())?;
    conn.execute(
        "UPDATE notes SET file_id = NULL
         WHERE file_id IS NOT NULL
           AND file_id NOT IN (SELECT id FROM items)
           AND file_id NOT IN (SELECT id FROM trash)",
        [],
    )
    .map_err(|error| error.to_string())?;

    conn.execute(
        "UPDATE trash SET workspace_id = COALESCE(
            NULLIF(workspace_id, ''),
            json_extract(data, '$.workspaceId')
        )",
        [],
    )
    .map_err(|error| error.to_string())?;

    let _ = conn.execute(
        "UPDATE workspaces SET data = json_set(
            data, '$.id', id, '$.name', name, '$.createdAt', created_at, '$.updatedAt', updated_at
        )",
        [],
    );
    let _ = conn.execute(
        "UPDATE items SET data = json_set(
            data, '$.id', id, '$.workspaceId', workspace_id, '$.title', name,
            '$.parentId', parent_id, '$.type', item_kind,
            '$.createdAt', created_at, '$.updatedAt', updated_at
        )",
        [],
    );
    let _ = conn.execute(
        "UPDATE notes SET data = json_set(
            data, '$.title', title, '$.content', content,
            '$.createdAt', created_at, '$.updatedAt', updated_at,
            '$.revision', revision, '$.workspaceId', workspace_id, '$.fileId', file_id
        )",
        [],
    );

    kv_set(conn, "schema_version", &json!(SCHEMA_VERSION))?;
    Ok(())
}

fn parse_object(raw: &str) -> Result<Map<String, Value>, String> {
    match serde_json::from_str::<Value>(raw).map_err(|error| error.to_string())? {
        Value::Object(map) => Ok(map),
        _ => Ok(Map::new()),
    }
}

/// The JSON `data` of a stored row, or — when it cannot be parsed — a stand-in object marked `unreadableData`.
/// The unreadable text is copied to `quarantine` first (the first copy wins), so the row is still loaded from its
/// columns: a later save keeps the row and the note body it owns instead of dropping them, and the raw text survives.
fn readable_data(conn: &Connection, table: &str, id: &str, raw: &str) -> String {
    let reason = match serde_json::from_str::<Value>(raw) {
        Ok(_) => return raw.to_string(),
        Err(error) => error.to_string(),
    };
    quarantine_raw(conn, table, id, raw, &reason);
    json!({ "unreadableData": true }).to_string()
}

fn quarantine_raw(conn: &Connection, table: &str, id: &str, raw: &str, reason: &str) {
    match conn.execute(
        "INSERT OR IGNORE INTO quarantine (table_name, id, data, reason, quarantined_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![table, id, raw, reason, now_millis()],
    ) {
        Ok(_) => eprintln!("TxtNote {table} satırı okunamadı ({id}): {reason}; ham veri karantinaya alındı"),
        Err(error) => eprintln!("TxtNote {table} satırı ({id}) karantinaya alınamadı: {error}"),
    }
}

fn json_str<'a>(value: &'a Value, keys: &[&str]) -> Option<&'a str> {
    for key in keys {
        if let Some(text) = value.get(*key).and_then(Value::as_str).filter(|text| !text.is_empty()) {
            return Some(text);
        }
    }
    None
}

fn json_time(value: &Value, key: &str, fallback: i64) -> i64 {
    value
        .get(key)
        .and_then(Value::as_i64)
        .filter(|time| *time > 0)
        .unwrap_or(fallback)
}

fn note_fingerprint(note: &Value) -> String {
    // Every field a note carries counts (HE-VB-08): a text file's encoding and language are part of what was saved.
    format!(
        "{}|{}|{}|{}|{}|{}|{}|{}|{}|{}|{}",
        note.get("title").and_then(Value::as_str).unwrap_or(""),
        note.get("content").and_then(Value::as_str).unwrap_or(""),
        note.get("todos").cloned().unwrap_or_else(|| json!([])),
        note.get("entries").cloned().unwrap_or_else(|| json!({})),
        note.get("mindmap")
            .cloned()
            .unwrap_or_else(|| json!({"nodes":[],"edges":[]})),
        note.get("vault").cloned().unwrap_or(Value::Null),
        note.get("researchData").cloned().unwrap_or(Value::Null),
        note.get("flashcards").cloned().unwrap_or(Value::Null),
        note.get("encoding").cloned().unwrap_or(Value::Null),
        note.get("languageId").cloned().unwrap_or(Value::Null),
        note.get("languageLocked").cloned().unwrap_or(Value::Null),
    )
}

fn hydrate_workspace(
    id: &str,
    name: &str,
    created_at: i64,
    updated_at: i64,
    raw: &str,
) -> Result<Value, String> {
    let mut obj = parse_object(raw)?;
    obj.insert("id".into(), json!(id));
    obj.insert("name".into(), json!(name));
    if created_at > 0 {
        obj.insert("createdAt".into(), json!(created_at));
    }
    if updated_at > 0 {
        obj.insert("updatedAt".into(), json!(updated_at));
    }
    Ok(Value::Object(obj))
}

fn hydrate_item(
    id: &str,
    workspace_id: &str,
    parent_id: Option<&str>,
    name: &str,
    item_kind: &str,
    created_at: i64,
    updated_at: i64,
    raw: &str,
) -> Result<Value, String> {
    let mut obj = parse_object(raw)?;
    obj.insert("id".into(), json!(id));
    obj.insert("workspaceId".into(), json!(workspace_id));
    obj.insert(
        "parentId".into(),
        match parent_id.filter(|value| !value.is_empty()) {
            Some(value) => json!(value),
            None => Value::Null,
        },
    );
    if !name.is_empty() || !obj.contains_key("title") {
        obj.insert("title".into(), json!(name));
    }
    if !item_kind.is_empty() && !obj.contains_key("type") {
        obj.insert("type".into(), json!(item_kind));
    }
    if created_at > 0 {
        obj.insert("createdAt".into(), json!(created_at));
    }
    if updated_at > 0 {
        obj.insert("updatedAt".into(), json!(updated_at));
    }
    Ok(Value::Object(obj))
}

fn hydrate_note(
    _id: &str,
    workspace_id: Option<&str>,
    file_id: Option<&str>,
    title: &str,
    content: &str,
    created_at: i64,
    updated_at: i64,
    revision: i64,
    raw: &str,
) -> Result<Value, String> {
    let mut obj = parse_object(raw)?;
    obj.insert("title".into(), json!(title));
    obj.insert("content".into(), json!(content));
    if created_at > 0 {
        obj.insert("createdAt".into(), json!(created_at));
    }
    if updated_at > 0 {
        obj.insert("updatedAt".into(), json!(updated_at));
    }
    obj.insert("revision".into(), json!(revision.max(1)));
    if let Some(workspace_id) = workspace_id.filter(|value| !value.is_empty()) {
        obj.insert("workspaceId".into(), json!(workspace_id));
    }
    obj.insert(
        "fileId".into(),
        match file_id.filter(|value| !value.is_empty()) {
            Some(value) => json!(value),
            None => Value::Null,
        },
    );
    Ok(Value::Object(obj))
}

fn hydrate_trash(
    id: &str,
    workspace_id: Option<&str>,
    deleted_at: i64,
    raw: &str,
) -> Result<Value, String> {
    let mut obj = parse_object(raw)?;
    obj.insert("id".into(), json!(id));
    if let Some(workspace_id) = workspace_id.filter(|value| !value.is_empty()) {
        obj.insert("workspaceId".into(), json!(workspace_id));
    }
    obj.insert("deletedAt".into(), json!(deleted_at));
    Ok(Value::Object(obj))
}

fn item_exists(conn: &Connection, id: &str) -> Result<bool, String> {
    let found: Option<i64> = conn
        .query_row("SELECT 1 FROM items WHERE id = ?1", params![id], |row| row.get(0))
        .optional()
        .map_err(|error| error.to_string())?;
    Ok(found.is_some())
}

fn lookup_item_links(conn: &Connection, id: &str) -> Result<(Option<String>, Option<String>), String> {
    let from_item: Option<(Option<String>, Option<String>)> = conn
        .query_row(
            "SELECT workspace_id, parent_id FROM items WHERE id = ?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    if let Some(links) = from_item {
        return Ok(links);
    }
    let from_trash: Option<(Option<String>, Option<String>)> = conn
        .query_row(
            "SELECT workspace_id, json_extract(data, '$.parentId') FROM trash WHERE id = ?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|error| error.to_string())?;
    Ok(from_trash.unwrap_or((None, None)))
}

static VERSION_SEQ: AtomicU64 = AtomicU64::new(0);

fn next_version_id() -> String {
    format!(
        "ver-{}-{}",
        now_millis(),
        VERSION_SEQ.fetch_add(1, Ordering::Relaxed)
    )
}

fn is_reserved_device_name(id: &str) -> bool {
    let stem = id.split('.').next().unwrap_or(id);
    matches!(
        stem.to_ascii_uppercase().as_str(),
        "CON"
            | "PRN"
            | "AUX"
            | "NUL"
            | "COM1"
            | "COM2"
            | "COM3"
            | "COM4"
            | "COM5"
            | "COM6"
            | "COM7"
            | "COM8"
            | "COM9"
            | "LPT1"
            | "LPT2"
            | "LPT3"
            | "LPT4"
            | "LPT5"
            | "LPT6"
            | "LPT7"
            | "LPT8"
            | "LPT9"
    )
}

fn safe_file_id(id: &str) -> Result<&str, String> {
    if id.is_empty() || id.len() > 180 {
        return Err("geçersiz medya kimliği".to_string());
    }
    if id.contains("..") || id.starts_with('.') || id.ends_with('.') {
        return Err("geçersiz medya kimliği".to_string());
    }
    if !id
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || ch == '.')
    {
        return Err("geçersiz medya kimliği".to_string());
    }
    if is_reserved_device_name(id) {
        return Err("geçersiz medya kimliği".to_string());
    }
    Ok(id)
}

fn json_id(value: &Value) -> Option<String> {
    value
        .get("id")
        .and_then(Value::as_str)
        .filter(|id| !id.is_empty())
        .map(str::to_string)
}

fn living_item_ids(snapshot: &Snapshot) -> HashSet<String> {
    snapshot
        .items
        .iter()
        .chain(snapshot.trash.iter())
        .filter_map(json_id)
        .collect()
}

#[cfg(test)]
fn item_is_living(conn: &Connection, id: &str) -> Result<bool, String> {
    let in_items: Option<i64> = conn
        .query_row("SELECT 1 FROM items WHERE id = ?1", params![id], |row| row.get(0))
        .optional()
        .map_err(|error| error.to_string())?;
    if in_items.is_some() {
        return Ok(true);
    }
    let in_trash: Option<i64> = conn
        .query_row("SELECT 1 FROM trash WHERE id = ?1", params![id], |row| row.get(0))
        .optional()
        .map_err(|error| error.to_string())?;
    Ok(in_trash.is_some())
}

fn prune_orphans(conn: &Connection, living: &HashSet<String>) -> Result<(), String> {
    conn.execute(
        "CREATE TEMP TABLE IF NOT EXISTS living_ids (id TEXT PRIMARY KEY)",
        [],
    )
    .map_err(|error| error.to_string())?;
    conn.execute("DELETE FROM living_ids", [])
        .map_err(|error| error.to_string())?;
    {
        let mut stmt = conn
            .prepare("INSERT OR IGNORE INTO living_ids (id) VALUES (?1)")
            .map_err(|error| error.to_string())?;
        for id in living {
            stmt.execute(params![id])
                .map_err(|error| error.to_string())?;
        }
    }

    let mut stale_paths = Vec::new();
    {
        let mut stmt = conn
            .prepare("SELECT path FROM media WHERE id NOT IN (SELECT id FROM living_ids)")
            .map_err(|error| error.to_string())?;
        let rows = stmt
            .query_map([], |row| row.get::<_, String>(0))
            .map_err(|error| error.to_string())?;
        for row in rows {
            stale_paths.push(row.map_err(|error| error.to_string())?);
        }
    }
    for path in stale_paths {
        let _ = fs::remove_file(path);
    }

    conn.execute("DELETE FROM notes WHERE id NOT IN (SELECT id FROM living_ids)", [])
        .map_err(|error| error.to_string())?;
    conn.execute(
        "DELETE FROM note_versions WHERE note_id NOT IN (SELECT id FROM living_ids)",
        [],
    )
    .map_err(|error| error.to_string())?;
    conn.execute("DELETE FROM media WHERE id NOT IN (SELECT id FROM living_ids)", [])
        .map_err(|error| error.to_string())?;
    let _ = conn.execute("DROP TABLE IF EXISTS living_ids", []);
    Ok(())
}

fn cap_note_versions(conn: &Connection, note_id: &str) -> Result<(), String> {
    conn.execute(
        "DELETE FROM note_versions WHERE rowid IN (
            SELECT rowid FROM note_versions WHERE note_id = ?1
            EXCEPT
            SELECT rowid FROM (
                SELECT rowid FROM note_versions WHERE note_id = ?1
                ORDER BY created_at DESC, rowid DESC LIMIT 50
            )
        )",
        params![note_id],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

fn upsert_note(conn: &Connection, id: &str, note: &Value) -> Result<(), String> {
    let existing: Option<(String, i64, i64, i64, Option<String>, Option<String>)> = conn
        .query_row(
            "SELECT data, created_at, updated_at, revision, workspace_id, file_id FROM notes WHERE id = ?1",
            params![id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?)),
        )
        .optional()
        .map_err(|error| error.to_string())?;

    let existing_note = existing
        .as_ref()
        .and_then(|(raw, _, _, _, _, _)| serde_json::from_str::<Value>(raw).ok());
    // An unreadable stored body is kept in quarantine before anything is written over it.
    if let (Some((raw, ..)), None) = (existing.as_ref(), existing_note.as_ref()) {
        quarantine_raw(conn, "notes", id, raw, "üzerine yazılmadan önce okunamayan not verisi");
    }
    let changed = existing_note
        .as_ref()
        .map(|previous| note_fingerprint(previous) != note_fingerprint(note))
        .unwrap_or(true);

    let now = now_millis();
    let created_at = json_time(
        note,
        "createdAt",
        existing
            .as_ref()
            .map(|row| row.1)
            .filter(|time| *time > 0)
            .unwrap_or(now),
    );
    let updated_at = if changed {
        json_time(note, "updatedAt", now)
    } else {
        existing
            .as_ref()
            .map(|row| row.2)
            .filter(|time| *time > 0)
            .unwrap_or(created_at)
    };
    let revision = match &existing {
        None => note
            .get("revision")
            .and_then(Value::as_i64)
            .filter(|value| *value >= 1)
            .unwrap_or(1),
        Some((_, _, _, current, _, _)) => {
            let current = (*current).max(1);
            if changed {
                current + 1
            } else {
                current
            }
        }
    };

    let (item_workspace, item_file) = lookup_item_links(conn, id)?;
    let workspace_id = json_str(note, &["workspaceId"])
        .map(str::to_string)
        .or(item_workspace)
        .or_else(|| existing.as_ref().and_then(|row| row.4.clone()))
        .filter(|value| !value.is_empty());
    let requested_file = json_str(note, &["fileId", "parentId"])
        .map(str::to_string)
        .or(item_file)
        .or_else(|| existing.as_ref().and_then(|row| row.5.clone()));
    let file_id = match requested_file.filter(|value| !value.is_empty()) {
        Some(value) if item_exists(conn, &value)? => Some(value),
        _ => None,
    };

    let title = json_str(note, &["title"]).unwrap_or("").to_string();
    let content = note.get("content").and_then(Value::as_str).unwrap_or("").to_string();

    let mut stored = note.clone();
    if let Some(obj) = stored.as_object_mut() {
        obj.insert("title".into(), json!(title));
        obj.insert("content".into(), json!(content));
        obj.insert("createdAt".into(), json!(created_at));
        obj.insert("updatedAt".into(), json!(updated_at));
        obj.insert("revision".into(), json!(revision));
        if let Some(workspace_id) = workspace_id.as_deref() {
            obj.insert("workspaceId".into(), json!(workspace_id));
        }
        obj.insert(
            "fileId".into(),
            match file_id.as_deref() {
                Some(value) => json!(value),
                None => Value::Null,
            },
        );
        if obj
            .get("walletAddress")
            .and_then(Value::as_str)
            .filter(|value| is_wallet_address(value))
            .is_none()
        {
            if let Some(address) = load_db_owner_inner(conn)?
                .and_then(|owner| owner.get("walletAddress").and_then(Value::as_str).map(str::to_string))
                .filter(|value| is_wallet_address(value))
            {
                obj.insert("walletAddress".into(), json!(address));
            }
        }
    }

    conn.execute(
        "INSERT INTO notes (
            id, workspace_id, file_id, title, content, created_at, updated_at, revision, data
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
         ON CONFLICT(id) DO UPDATE SET
            workspace_id = excluded.workspace_id,
            file_id = excluded.file_id,
            title = excluded.title,
            content = excluded.content,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            revision = excluded.revision,
            data = excluded.data",
        params![
            id,
            workspace_id,
            file_id,
            title,
            content,
            created_at,
            updated_at,
            revision,
            stored.to_string()
        ],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

fn save_snapshot_inner(conn: &Connection, snapshot: Snapshot) -> Result<(), String> {
    let existing: i64 = conn
        .query_row("SELECT COUNT(*) FROM workspaces", [], |row| row.get(0))
        .unwrap_or(0);
    if snapshot.workspaces.is_empty() && existing > 0 {
        return Err("boş anlık görüntü, dolu veritabanının üzerine yazılmaz".to_string());
    }
    let tx = conn
        .unchecked_transaction()
        .map_err(|error| error.to_string())?;
    tx.execute_batch("PRAGMA defer_foreign_keys = ON")
        .map_err(|error| error.to_string())?;
    tx.execute("DELETE FROM items", [])
        .map_err(|error| error.to_string())?;
    tx.execute("DELETE FROM trash", [])
        .map_err(|error| error.to_string())?;
    tx.execute("DELETE FROM workspaces", [])
        .map_err(|error| error.to_string())?;

    let now = now_millis();
    for (index, workspace) in snapshot.workspaces.iter().enumerate() {
        let id = workspace
            .get("id")
            .and_then(Value::as_str)
            .ok_or_else(|| "workspace.id missing".to_string())?;
        let name = json_str(workspace, &["name"]).unwrap_or("").to_string();
        let created_at = json_time(workspace, "createdAt", now);
        let updated_at = json_time(workspace, "updatedAt", created_at);
        let mut stored = workspace.clone();
        if let Some(object) = stored.as_object_mut() {
            object.insert("id".into(), json!(id));
            object.insert("name".into(), json!(name));
            object.insert("createdAt".into(), json!(created_at));
            object.insert("updatedAt".into(), json!(updated_at));
        }
        tx.execute(
            "INSERT INTO workspaces (id, name, created_at, updated_at, sort_order, data)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![id, name, created_at, updated_at, index as i64, stored.to_string()],
        )
        .map_err(|error| error.to_string())?;
    }

    for (index, item) in snapshot.items.iter().enumerate() {
        let id = item
            .get("id")
            .and_then(Value::as_str)
            .ok_or_else(|| "item.id missing".to_string())?;
        let workspace_id = item
            .get("workspaceId")
            .and_then(Value::as_str)
            .unwrap_or("");
        let parent_id = json_str(item, &["parentId"]).map(str::to_string);
        let name = json_str(item, &["title", "name"]).unwrap_or("").to_string();
        let item_kind = json_str(item, &["type"]).unwrap_or("document").to_string();
        let created_at = json_time(item, "createdAt", now);
        let updated_at = json_time(item, "updatedAt", created_at);
        let mut stored = item.clone();
        if let Some(object) = stored.as_object_mut() {
            object.remove("url");
            object.insert("id".into(), json!(id));
            object.insert("workspaceId".into(), json!(workspace_id));
            object.insert(
                "parentId".into(),
                match parent_id.as_deref() {
                    Some(value) => json!(value),
                    None => Value::Null,
                },
            );
            object.insert("title".into(), json!(name));
            object.insert("createdAt".into(), json!(created_at));
            object.insert("updatedAt".into(), json!(updated_at));
        }
        tx.execute(
            "INSERT INTO items (
                id, workspace_id, parent_id, name, item_kind, created_at, updated_at, sort_order, data
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                id,
                workspace_id,
                parent_id,
                name,
                item_kind,
                created_at,
                updated_at,
                index as i64,
                stored.to_string()
            ],
        )
        .map_err(|error| error.to_string())?;
    }

    for row in &snapshot.trash {
        let id = row
            .get("id")
            .and_then(Value::as_str)
            .ok_or_else(|| "trash.id missing".to_string())?;
        let workspace_id = json_str(row, &["workspaceId"]).map(str::to_string);
        let deleted_at = row.get("deletedAt").and_then(Value::as_i64).unwrap_or(0);
        let mut stored = row.clone();
        if let Some(object) = stored.as_object_mut() {
            object.insert("id".into(), json!(id));
            if let Some(workspace_id) = workspace_id.as_deref() {
                object.insert("workspaceId".into(), json!(workspace_id));
            }
            object.insert("deletedAt".into(), json!(deleted_at));
        }
        tx.execute(
            "INSERT INTO trash (id, workspace_id, deleted_at, data) VALUES (?1, ?2, ?3, ?4)",
            params![id, workspace_id, deleted_at, stored.to_string()],
        )
        .map_err(|error| error.to_string())?;
    }

    tx.execute(
        "UPDATE notes SET
            workspace_id = (SELECT workspace_id FROM items WHERE items.id = notes.id),
            file_id = (SELECT parent_id FROM items WHERE items.id = notes.id)
         WHERE EXISTS (SELECT 1 FROM items WHERE items.id = notes.id)",
        [],
    )
    .map_err(|error| error.to_string())?;
    tx.execute(
        "UPDATE notes SET file_id = NULL
         WHERE file_id IS NOT NULL
           AND file_id NOT IN (SELECT id FROM items)
           AND file_id NOT IN (SELECT id FROM trash)",
        [],
    )
    .map_err(|error| error.to_string())?;

    let living = living_item_ids(&snapshot);
    sync_db_owner_from_profile(&tx, &snapshot.profile)?;
    // Only upsert bodies whose item still lives. A partial in-memory map must
    // not resurrect a note that was already forgotten, and must not DELETE
    // bodies the shell has not fetched yet — prune_orphans keys off items/trash.
    for (id, note) in &snapshot.notes {
        if living.contains(id) {
            upsert_note(&tx, id, note)?;
        }
    }
    prune_orphans(&tx, &living)?;

    kv_set(&tx, "trash_enabled", &json!(snapshot.trash_enabled))?;
    kv_set(&tx, "session", &snapshot.session)?;
    kv_set(&tx, "profile", &snapshot.profile)?;
    tx.commit().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn load_shell(app: AppHandle) -> Result<Snapshot, String> {
    spawn_db(app, |db| db.with_conn(load_shell_inner)).await
}

#[tauri::command]
pub async fn load_notes(app: AppHandle, ids: Option<Vec<String>>) -> Result<Map<String, Value>, String> {
    spawn_db(app, move |db| {
        db.with_conn(|conn| load_notes_inner(conn, ids.as_deref()))
    })
    .await
}

#[tauri::command]
pub async fn load_snapshot(app: AppHandle) -> Result<Snapshot, String> {
    spawn_db(app, |db| db.with_conn(load_snapshot_inner)).await
}

#[tauri::command]
pub async fn save_snapshot(app: AppHandle, snapshot: Snapshot) -> Result<(), String> {
    spawn_db(app, move |db| db.with_conn(|conn| save_snapshot_inner(conn, snapshot))).await
}

#[tauri::command]
pub async fn save_snapshot_json(app: AppHandle, json: String) -> Result<(), String> {
    let snapshot: Snapshot = serde_json::from_str(&json).map_err(|error| error.to_string())?;
    save_snapshot(app, snapshot).await
}

#[tauri::command]
pub async fn load_snapshot_json(app: AppHandle) -> Result<String, String> {
    let snapshot = load_snapshot(app).await?;
    serde_json::to_string(&snapshot).map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn save_note(app: AppHandle, id: String, note: Value) -> Result<(), String> {
    spawn_db(app, move |db| db.with_conn(|conn| upsert_note(conn, &id, &note))).await
}

#[tauri::command]
pub async fn append_version(app: AppHandle, payload: Value) -> Result<Value, String> {
    spawn_db(app, move |db| {
        db.with_conn(|conn| {
            let note_id = payload
                .get("noteId")
                .and_then(Value::as_str)
                .ok_or_else(|| "noteId gerekli.".to_string())?
                .to_string();
            let hash = payload
                .get("hash")
                .and_then(Value::as_str)
                .ok_or_else(|| "hash gerekli.".to_string())?
                .to_string();

            let latest: Option<(String, String)> = conn
                .query_row(
                    "SELECT hash, data FROM note_versions WHERE note_id = ?1 ORDER BY created_at DESC LIMIT 1",
                    params![note_id],
                    |row| Ok((row.get(0)?, row.get(1)?)),
                )
                .optional()
                .map_err(|error| error.to_string())?;

            if let Some((latest_hash, data)) = latest {
                if latest_hash == hash {
                    return serde_json::from_str(&data).map_err(|error| error.to_string());
                }
            }

            let created_at = payload
                .get("updatedAt")
                .and_then(Value::as_i64)
                .unwrap_or_else(now_millis);
            let id = next_version_id();
            let version = json!({
                "id": id,
                "noteId": note_id,
                "createdAt": created_at,
                "hash": hash,
                "payload": payload,
                "source": "local"
            });

            conn.execute(
                "INSERT INTO note_versions (id, note_id, created_at, hash, data) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![id, note_id, created_at, hash, version.to_string()],
            )
            .map_err(|error| error.to_string())?;
            cap_note_versions(conn, &note_id)?;
            Ok(version)
        })
    })
    .await
}

#[tauri::command]
pub async fn list_history(app: AppHandle, note_id: String) -> Result<Vec<Value>, String> {
    spawn_db(app, move |db| {
        db.with_conn(|conn| {
            let mut stmt = conn
                .prepare(
                    "SELECT data FROM note_versions WHERE note_id = ?1 ORDER BY created_at DESC, rowid DESC",
                )
                .map_err(|error| error.to_string())?;
            let rows = stmt
                .query_map(params![note_id], |row| row.get::<_, String>(0))
                .map_err(|error| error.to_string())?;
            let mut out = Vec::new();
            for row in rows {
                let raw = row.map_err(|error| error.to_string())?;
                out.push(serde_json::from_str(&raw).map_err(|error| error.to_string())?);
            }
            Ok(out)
        })
    })
    .await
}

#[tauri::command]
pub async fn get_version(
    app: AppHandle,
    note_id: String,
    version_id: String,
) -> Result<Option<Value>, String> {
    spawn_db(app, move |db| {
        db.with_conn(|conn| {
            let raw: Option<String> = conn
                .query_row(
                    "SELECT data FROM note_versions WHERE note_id = ?1 AND id = ?2",
                    params![note_id, version_id],
                    |row| row.get(0),
                )
                .optional()
                .map_err(|error| error.to_string())?;
            raw.map(|value| serde_json::from_str(&value).map_err(|error| error.to_string()))
                .transpose()
        })
    })
    .await
}

#[tauri::command]
pub async fn write_media(
    app: AppHandle,
    id: String,
    mime: String,
    data: Vec<u8>,
) -> Result<String, String> {
    write_media_chunk(app, id, mime, data, false).await
}

#[tauri::command]
pub async fn write_media_chunk(
    app: AppHandle,
    id: String,
    mime: String,
    data: Vec<u8>,
    append: bool,
) -> Result<String, String> {
    spawn_db(app, move |db| {
        let id = safe_file_id(&id)?.to_string();
        let path = db.media_dir().join(&id);
        if append {
            let mut file = OpenOptions::new()
                .create(true)
                .append(true)
                .open(&path)
                .map_err(|error| error.to_string())?;
            file.write_all(&data).map_err(|error| error.to_string())?;
        } else {
            fs::write(&path, &data).map_err(|error| error.to_string())?;
        }
        let stored = path.to_string_lossy().to_string();
        db.with_conn(|conn| {
            conn.execute(
                "INSERT INTO media (id, mime, path) VALUES (?1, ?2, ?3)
                 ON CONFLICT(id) DO UPDATE SET mime = excluded.mime, path = excluded.path",
                params![id, mime, stored],
            )
            .map_err(|error| error.to_string())?;
            Ok(stored.clone())
        })
    })
    .await
}

#[tauri::command]
pub async fn open_media(app: AppHandle, id: String) -> Result<(), String> {
    let id = safe_file_id(&id)?.to_string();
    let opener = app.clone();
    let path = spawn_db(app, move |db| {
        let fallback = db.media_dir().join(&id);
        db.with_conn(|conn| {
            let stored: Option<String> = conn
                .query_row(
                    "SELECT path FROM media WHERE id = ?1",
                    params![id],
                    |row| row.get(0),
                )
                .optional()
                .map_err(|error| error.to_string())?;
            Ok(stored.unwrap_or_else(|| fallback.to_string_lossy().to_string()))
        })
    })
    .await?;
    if !std::path::Path::new(&path).exists() {
        return Err("Dosya diskte bulunamadı. Yeniden seçmen gerekebilir.".into());
    }
    use tauri_plugin_opener::OpenerExt;
    opener
        .opener()
        .open_path(&path, None::<&str>)
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_media(app: AppHandle, id: String) -> Result<(), String> {
    spawn_db(app, move |db| {
        if let Ok(safe) = safe_file_id(&id) {
            let _ = fs::remove_file(db.media_dir().join(safe));
        }
        db.with_conn(|conn| {
            conn.execute("DELETE FROM media WHERE id = ?1", params![id])
                .map_err(|error| error.to_string())?;
            conn.execute("DELETE FROM note_versions WHERE note_id = ?1", params![id])
                .map_err(|error| error.to_string())?;
            conn.execute("DELETE FROM notes WHERE id = ?1", params![id])
                .map_err(|error| error.to_string())?;
            Ok(())
        })
    })
    .await
}

fn wipe_local_database_inner(conn: &Connection) -> Result<(), String> {
    let tx = conn
        .unchecked_transaction()
        .map_err(|error| error.to_string())?;
    tx.execute_batch("PRAGMA defer_foreign_keys = ON")
        .map_err(|error| error.to_string())?;
    for table in ["note_versions", "notes", "items", "trash", "workspaces", "media", "kv", "quarantine"] {
        tx.execute(&format!("DELETE FROM {table}"), [])
            .map_err(|error| error.to_string())?;
    }
    tx.commit().map_err(|error| error.to_string())?;
    conn.execute_batch("VACUUM").map_err(|error| error.to_string())?;
    Ok(())
}

/// Temporary test helper: removes every row and every media file on this device.
#[tauri::command]
pub async fn wipe_local_database(app: AppHandle) -> Result<(), String> {
    spawn_db(app, |db| {
        db.with_conn(wipe_local_database_inner)?;
        if let Ok(entries) = fs::read_dir(db.media_dir()) {
            for entry in entries.flatten() {
                let _ = fs::remove_file(entry.path());
            }
        }
        Ok(())
    })
    .await
}

#[tauri::command]
pub async fn load_db_owner(app: AppHandle) -> Result<Option<Value>, String> {
    spawn_db(app, |db| db.with_conn(load_db_owner_inner)).await
}

#[tauri::command]
pub async fn bind_db_owner(app: AppHandle, owner: Value) -> Result<Value, String> {
    spawn_db(app, move |db| db.with_conn(|conn| bind_db_owner_inner(conn, &owner))).await
}

#[cfg(test)]
mod tests {
    use super::*;

    fn memory_db() -> Connection {
        let conn = Connection::open_in_memory().expect("memory sqlite");
        conn.execute_batch(SCHEMA).expect("schema");
        migrate_schema(&conn).expect("migrate");
        conn
    }

    fn two_note_snapshot() -> Snapshot {
        let mut notes = Map::new();
        notes.insert("n1".into(), json!({"title": "Bir", "content": "birinci gövde"}));
        notes.insert("n2".into(), json!({"title": "İki", "content": "ikinci gövde", "encoding": "utf-16le"}));
        Snapshot {
            workspaces: vec![json!({"id": "w1", "name": "A"})],
            items: vec![json!({"id": "n1", "workspaceId": "w1", "title": "Bir"}), json!({"id": "n2", "workspaceId": "w1", "title": "İki"})],
            notes,
            ..Snapshot::default()
        }
    }

    fn count(conn: &Connection, sql: &str) -> i64 {
        conn.query_row(sql, [], |row| row.get(0)).unwrap()
    }

    // HE-VB-01: an item row whose data is unreadable is loaded from its columns; saving the loaded shell back
    // (as the app does on its first change) keeps the item and its note body, and the raw text is quarantined.
    #[test]
    fn unreadable_item_row_survives_load_and_save() {
        let conn = memory_db();
        save_snapshot_inner(&conn, two_note_snapshot()).expect("first save");
        conn.execute("UPDATE items SET data = 'not json' WHERE id = 'n2'", []).unwrap();

        let shell = load_shell_inner(&conn).expect("load shell");
        assert_eq!(shell.items.len(), 2);
        let n2 = shell.items.iter().find(|item| json_id(item).as_deref() == Some("n2")).expect("n2 loaded");
        assert_eq!(n2.get("unreadableData"), Some(&json!(true)));
        assert_eq!(n2.get("title"), Some(&json!("İki")));

        save_snapshot_inner(&conn, shell).expect("save loaded shell");
        assert_eq!(count(&conn, "SELECT COUNT(*) FROM items"), 2);
        assert_eq!(count(&conn, "SELECT COUNT(*) FROM notes WHERE id = 'n2' AND content = 'ikinci gövde'"), 1);
        let raw: String = conn
            .query_row("SELECT data FROM quarantine WHERE table_name = 'items' AND id = 'n2'", [], |row| row.get(0))
            .unwrap();
        assert_eq!(raw, "not json");
    }

    // HE-VB-02: one unreadable note row neither fails the snapshot nor the other notes; its columns still load,
    // and writing over it keeps the raw text in quarantine.
    #[test]
    fn unreadable_note_row_does_not_fail_other_notes() {
        let conn = memory_db();
        save_snapshot_inner(&conn, two_note_snapshot()).expect("first save");
        conn.execute("UPDATE notes SET data = '{broken' WHERE id = 'n1'", []).unwrap();

        let snapshot = load_snapshot_inner(&conn).expect("snapshot loads");
        assert_eq!(snapshot.notes.len(), 2);
        assert_eq!(snapshot.notes["n1"].get("content"), Some(&json!("birinci gövde")));
        assert_eq!(snapshot.notes["n1"].get("unreadableData"), Some(&json!(true)));
        assert_eq!(snapshot.notes["n2"].get("encoding"), Some(&json!("utf-16le")));
        assert_eq!(load_notes_inner(&conn, Some(&["n1".to_string()])).expect("n1 alone").len(), 1);

        upsert_note(&conn, "n1", &json!({"title": "Bir", "content": ""})).expect("overwrite");
        let raw: String = conn
            .query_row("SELECT data FROM quarantine WHERE table_name = 'notes' AND id = 'n1'", [], |row| row.get(0))
            .unwrap();
        assert_eq!(raw, "{broken");

        // Written over without being loaded first: the guard in upsert_note keeps the raw text too.
        conn.execute("UPDATE notes SET data = '[[' WHERE id = 'n2'", []).unwrap();
        upsert_note(&conn, "n2", &json!({"title": "İki", "content": ""})).expect("overwrite unloaded");
        let raw: String = conn
            .query_row("SELECT data FROM quarantine WHERE table_name = 'notes' AND id = 'n2'", [], |row| row.get(0))
            .unwrap();
        assert_eq!(raw, "[[");
    }

    // HE-VB-03/08: a text file's encoding and language survive a save and a change to them is a new revision.
    #[test]
    fn note_file_fields_survive_and_count_as_a_change() {
        let conn = memory_db();
        save_snapshot_inner(&conn, two_note_snapshot()).expect("first save");
        upsert_note(&conn, "n2", &json!({"title": "İki", "content": "ikinci gövde", "encoding": "utf-16le", "languageId": "python", "languageLocked": true})).unwrap();
        let first = load_notes_inner(&conn, Some(&["n2".to_string()])).unwrap()["n2"].clone();
        assert_eq!(first.get("languageLocked"), Some(&json!(true)));
        upsert_note(&conn, "n2", &json!({"title": "İki", "content": "ikinci gövde", "encoding": "utf-8", "languageId": "python", "languageLocked": true})).unwrap();
        let second = load_notes_inner(&conn, Some(&["n2".to_string()])).unwrap()["n2"].clone();
        assert_eq!(second.get("encoding"), Some(&json!("utf-8")));
        assert_eq!(second["revision"].as_i64().unwrap(), first["revision"].as_i64().unwrap() + 1);
    }

    #[test]
    fn safe_file_id_rejects_traversal_and_devices() {
        assert!(safe_file_id("../secret").is_err());
        assert!(safe_file_id("a/b").is_err());
        assert!(safe_file_id("NUL").is_err());
        assert!(safe_file_id("nul.txt").is_err());
        assert!(safe_file_id("").is_err());
        assert!(safe_file_id("itm-abc_123").is_ok());
    }

    #[test]
    fn save_snapshot_drops_notes_whose_item_is_gone() {
        let conn = memory_db();
        let mut notes = Map::new();
        notes.insert("n1".into(), json!({"content": "keep-me"}));
        save_snapshot_inner(
            &conn,
            Snapshot {
                workspaces: vec![json!({"id": "w1", "name": "A"})],
                items: vec![json!({"id": "n1", "workspaceId": "w1"})],
                notes: notes.clone(),
                ..Snapshot::default()
            },
        )
        .expect("first save");

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM notes", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 1);

        save_snapshot_inner(
            &conn,
            Snapshot {
                workspaces: vec![json!({"id": "w1", "name": "A"})],
                items: vec![],
                notes: notes.clone(),
                ..Snapshot::default()
            },
        )
        .expect("second save");

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM notes", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn save_snapshot_keeps_unloaded_note_when_item_still_exists() {
        let conn = memory_db();
        let mut notes = Map::new();
        notes.insert("n1".into(), json!({"content": "body"}));
        save_snapshot_inner(
            &conn,
            Snapshot {
                workspaces: vec![json!({"id": "w1"})],
                items: vec![json!({"id": "n1", "workspaceId": "w1"})],
                notes,
                ..Snapshot::default()
            },
        )
        .expect("seed");

        save_snapshot_inner(
            &conn,
            Snapshot {
                workspaces: vec![json!({"id": "w1"})],
                items: vec![json!({"id": "n1", "workspaceId": "w1"})],
                notes: Map::new(),
                ..Snapshot::default()
            },
        )
        .expect("partial persist");

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM notes", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn prune_orphans_deletes_notes_without_items() {
        let conn = memory_db();
        upsert_note(&conn, "ghost", &json!({"content": "nope"})).unwrap();
        assert!(item_is_living(&conn, "ghost").unwrap() == false);
        // Living check is what the command uses before upsert; an orphan row
        // from a race is then removed when the item list is persisted.
        let living = HashSet::new();
        prune_orphans(&conn, &living).unwrap();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM notes", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn same_workspace_name_keeps_distinct_uuids() {
        let conn = memory_db();
        save_snapshot_inner(
            &conn,
            Snapshot {
                workspaces: vec![
                    json!({"id": "ws-a", "name": "Okul İşleri"}),
                    json!({"id": "ws-b", "name": "Okul İşleri"}),
                ],
                ..Snapshot::default()
            },
        )
        .expect("save");

        let mut stmt = conn
            .prepare("SELECT id, name, created_at, updated_at FROM workspaces ORDER BY id")
            .unwrap();
        let rows: Vec<(String, String, i64, i64)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)))
            .unwrap()
            .map(|row| row.unwrap())
            .collect();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].1, "Okul İşleri");
        assert_eq!(rows[1].1, "Okul İşleri");
        assert_ne!(rows[0].0, rows[1].0);
        assert!(rows[0].2 > 0 && rows[0].3 > 0);
    }

    #[test]
    fn note_file_id_is_null_at_workspace_root_and_set_in_a_folder() {
        let conn = memory_db();
        let mut notes = Map::new();
        notes.insert("n-root".into(), json!({"title": "Root", "content": "a"}));
        notes.insert("n-child".into(), json!({"title": "Child", "content": "b"}));
        save_snapshot_inner(
            &conn,
            Snapshot {
                workspaces: vec![json!({"id": "w1", "name": "A"})],
                items: vec![
                    json!({"id": "folder-1", "workspaceId": "w1", "title": "Dosya", "type": "folder"}),
                    json!({"id": "n-root", "workspaceId": "w1", "title": "Root", "type": "document"}),
                    json!({"id": "n-child", "workspaceId": "w1", "title": "Child", "type": "document", "parentId": "folder-1"}),
                ],
                notes,
                ..Snapshot::default()
            },
        )
        .expect("save");

        let root_file: Option<String> = conn
            .query_row("SELECT file_id FROM notes WHERE id = 'n-root'", [], |row| row.get(0))
            .unwrap();
        let child_file: Option<String> = conn
            .query_row("SELECT file_id FROM notes WHERE id = 'n-child'", [], |row| row.get(0))
            .unwrap();
        let root_ws: String = conn
            .query_row("SELECT workspace_id FROM notes WHERE id = 'n-root'", [], |row| row.get(0))
            .unwrap();
        assert_eq!(root_file, None);
        assert_eq!(child_file.as_deref(), Some("folder-1"));
        assert_eq!(root_ws, "w1");
    }

    #[test]
    fn note_revision_increments_only_when_body_changes() {
        let conn = memory_db();
        save_snapshot_inner(
            &conn,
            Snapshot {
                workspaces: vec![json!({"id": "w1", "name": "A"})],
                items: vec![json!({"id": "n1", "workspaceId": "w1", "title": "T", "type": "document"})],
                ..Snapshot::default()
            },
        )
        .expect("shell");

        upsert_note(&conn, "n1", &json!({"title": "T", "content": "one", "workspaceId": "w1"})).unwrap();
        let first: i64 = conn
            .query_row("SELECT revision FROM notes WHERE id = 'n1'", [], |row| row.get(0))
            .unwrap();
        assert_eq!(first, 1);

        upsert_note(&conn, "n1", &json!({"title": "T", "content": "one", "workspaceId": "w1"})).unwrap();
        let same: i64 = conn
            .query_row("SELECT revision FROM notes WHERE id = 'n1'", [], |row| row.get(0))
            .unwrap();
        assert_eq!(same, 1);

        upsert_note(&conn, "n1", &json!({"title": "T", "content": "two", "workspaceId": "w1"})).unwrap();
        let bumped: (i64, String, String, i64, i64) = conn
            .query_row("SELECT revision, title, content, created_at, updated_at FROM notes WHERE id = 'n1'", [], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?,
                    row.get::<_, i64>(4)?,
                ))
            })
            .unwrap();
        assert_eq!(bumped.0, 2);
        assert_eq!(bumped.1, "T");
        assert_eq!(bumped.2, "two");
        assert!(bumped.3 > 0 && bumped.4 > 0);
    }

    #[test]
    fn load_snapshot_exposes_package_fields() {
        let conn = memory_db();
        let mut notes = Map::new();
        notes.insert("n1".into(), json!({"title": "Ders", "content": "hello"}));
        save_snapshot_inner(
            &conn,
            Snapshot {
                workspaces: vec![json!({"id": "w1", "name": "Okul İşleri"})],
                items: vec![
                    json!({"id": "f1", "workspaceId": "w1", "title": "Klasör", "type": "folder"}),
                    json!({"id": "n1", "workspaceId": "w1", "title": "Ders", "type": "document", "parentId": "f1"}),
                ],
                notes,
                ..Snapshot::default()
            },
        )
        .expect("save");

        let snapshot = load_snapshot_inner(&conn).expect("load");
        assert_eq!(snapshot.workspaces[0]["id"], "w1");
        assert_eq!(snapshot.workspaces[0]["name"], "Okul İşleri");
        assert!(snapshot.workspaces[0]["createdAt"].as_i64().unwrap() > 0);
        let note = snapshot.notes.get("n1").unwrap();
        assert_eq!(note["title"], "Ders");
        assert_eq!(note["content"], "hello");
        assert_eq!(note["workspaceId"], "w1");
        assert_eq!(note["fileId"], "f1");
        assert_eq!(note["revision"], 1);
        assert!(note["createdAt"].as_i64().unwrap() > 0);
        assert!(note["updatedAt"].as_i64().unwrap() > 0);
    }

    #[test]
    fn migrate_backfills_legacy_json_blob_rows() {
        let conn = Connection::open_in_memory().expect("memory sqlite");
        conn.execute_batch(
            "
            CREATE TABLE workspaces (id TEXT PRIMARY KEY, sort_order INTEGER NOT NULL, data TEXT NOT NULL);
            CREATE TABLE items (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, sort_order INTEGER NOT NULL, data TEXT NOT NULL);
            CREATE TABLE notes (id TEXT PRIMARY KEY, updated_at INTEGER NOT NULL, data TEXT NOT NULL);
            CREATE TABLE trash (id TEXT PRIMARY KEY, deleted_at INTEGER NOT NULL, data TEXT NOT NULL);
            CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
            ",
        )
        .unwrap();
        conn.execute(
            "INSERT INTO workspaces (id, sort_order, data) VALUES ('w1', 0, ?1)",
            params![json!({"id":"w1","name":"Eski"}).to_string()],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO items (id, workspace_id, sort_order, data) VALUES ('n1', 'w1', 0, ?1)",
            params![json!({"id":"n1","workspaceId":"w1","title":"Not","type":"document"}).to_string()],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO notes (id, updated_at, data) VALUES ('n1', 99, ?1)",
            params![json!({"title":"Not","content":"eski"}).to_string()],
        )
        .unwrap();

        migrate_schema(&conn).expect("migrate legacy");

        let name: String = conn
            .query_row("SELECT name FROM workspaces WHERE id = 'w1'", [], |row| row.get(0))
            .unwrap();
        let revision: i64 = conn
            .query_row("SELECT revision FROM notes WHERE id = 'n1'", [], |row| row.get(0))
            .unwrap();
        let workspace_id: String = conn
            .query_row("SELECT workspace_id FROM notes WHERE id = 'n1'", [], |row| row.get(0))
            .unwrap();
        assert_eq!(name, "Eski");
        assert_eq!(revision, 1);
        assert_eq!(workspace_id, "w1");
    }

    #[test]
    fn schema_batch_then_migrate_opens_legacy_json_database() {
        let conn = Connection::open_in_memory().expect("memory sqlite");
        conn.execute_batch(
            "
            CREATE TABLE workspaces (id TEXT PRIMARY KEY, sort_order INTEGER NOT NULL, data TEXT NOT NULL);
            CREATE TABLE items (id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, sort_order INTEGER NOT NULL, data TEXT NOT NULL);
            CREATE TABLE notes (id TEXT PRIMARY KEY, updated_at INTEGER NOT NULL, data TEXT NOT NULL);
            CREATE TABLE trash (id TEXT PRIMARY KEY, deleted_at INTEGER NOT NULL, data TEXT NOT NULL);
            CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
            CREATE TABLE note_versions (
              id TEXT PRIMARY KEY,
              note_id TEXT NOT NULL,
              created_at INTEGER NOT NULL,
              hash TEXT NOT NULL,
              data TEXT NOT NULL
            );
            CREATE TABLE media (id TEXT PRIMARY KEY, mime TEXT NOT NULL, path TEXT NOT NULL);
            ",
        )
        .unwrap();
        conn.execute(
            "INSERT INTO workspaces (id, sort_order, data) VALUES ('w1', 0, ?1)",
            params![json!({"id":"w1","name":"Eski"}).to_string()],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO items (id, workspace_id, sort_order, data) VALUES ('n1', 'w1', 0, ?1)",
            params![json!({"id":"n1","workspaceId":"w1","title":"Not","type":"document"}).to_string()],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO notes (id, updated_at, data) VALUES ('n1', 99, ?1)",
            params![json!({"title":"Not","content":"eski metin"}).to_string()],
        )
        .unwrap();

        conn.execute_batch(SCHEMA).expect("schema on legacy tables");
        migrate_schema(&conn).expect("migrate legacy columns");

        let shell = load_shell_inner(&conn).expect("load shell");
        assert_eq!(shell.workspaces.len(), 1);
        assert_eq!(shell.items.len(), 1);
        assert_eq!(shell.workspaces[0]["name"], "Eski");
        assert_eq!(shell.items[0]["title"], "Not");

        let notes = load_notes_inner(&conn, None).expect("load notes");
        assert_eq!(notes["n1"]["content"], "eski metin");
    }

    #[test]
    fn research_data_survives_sqlite_and_changes_fingerprint() {
        let conn = memory_db();
        let note = json!({"title":"Research", "content":"", "researchData": {
            "sourceTitle":"Paper", "abstract":"<p>Summary</p>",
            "quotes":[{"id":"quote-uuid", "text":"Quote", "page":"12", "comment":"Comment"}]
        }});
        conn.execute(
            "INSERT INTO notes (id, updated_at, data) VALUES ('research-uuid', 99, ?1)",
            params![note.to_string()],
        ).expect("save research");
        let loaded = load_notes_inner(&conn, None).expect("reload research");
        assert_eq!(loaded["research-uuid"]["researchData"], note["researchData"]);
        let mut edited = note.clone();
        edited["researchData"]["quotes"] = json!([]);
        assert_ne!(note_fingerprint(&note), note_fingerprint(&edited));
    }

    #[test]
    fn flashcards_survive_sqlite_and_change_fingerprint() {
        let conn = memory_db();
        let note = json!({
            "title": "Flashcards",
            "content": "",
            "flashcards": {
                "cards": [{"id": "c1", "front": "Soru", "back": "Cevap", "image": null}]
            }
        });
        conn.execute(
            "INSERT INTO notes (id, updated_at, data) VALUES ('cards-uuid', 99, ?1)",
            params![note.to_string()],
        )
        .expect("save flashcards");
        let loaded = load_notes_inner(&conn, None).expect("reload flashcards");
        assert_eq!(loaded["cards-uuid"]["flashcards"]["cards"][0]["front"], "Soru");
        let mut edited = note.clone();
        edited["flashcards"]["cards"][0]["front"] = json!("Soru?");
        assert_ne!(note_fingerprint(&note), note_fingerprint(&edited));
    }

    #[test]
    fn db_owner_binds_once_and_rejects_a_different_wallet() {
        let conn = memory_db();
        let owner = json!({
            "walletAddress": "0x1111111111111111111111111111111111111111",
            "walletProvider": "local-keyring"
        });
        bind_db_owner_inner(&conn, &owner).expect("bind");
        let loaded = load_db_owner_inner(&conn).unwrap().unwrap();
        assert_eq!(loaded["walletAddress"], owner["walletAddress"]);

        bind_db_owner_inner(&conn, &owner).expect("idempotent");
        let other = json!({
            "walletAddress": "0x2222222222222222222222222222222222222222"
        });
        assert!(bind_db_owner_inner(&conn, &other).is_err());

        let replaced = bind_db_owner_inner(
            &conn,
            &json!({
                "walletAddress": "0x2222222222222222222222222222222222222222",
                "replace": true
            }),
        )
        .expect("replace");
        assert_eq!(
            replaced["walletAddress"],
            "0x2222222222222222222222222222222222222222"
        );
        assert!(replaced.get("replace").is_none());
    }

    #[test]
    fn wipe_clears_every_table_including_owner() {
        let conn = memory_db();
        bind_db_owner_inner(
            &conn,
            &json!({"walletAddress": "0x1111111111111111111111111111111111111111"}),
        )
        .unwrap();
        save_snapshot_inner(
            &conn,
            Snapshot {
                workspaces: vec![json!({"id": "w1", "name": "A"})],
                items: vec![json!({"id": "n1", "workspaceId": "w1", "title": "T", "type": "document"})],
                notes: [("n1".to_string(), json!({"title": "T", "content": "body"}))]
                    .into_iter()
                    .collect(),
                ..Snapshot::default()
            },
        )
        .expect("seed");
        wipe_local_database_inner(&conn).expect("wipe");
        let workspaces: i64 = conn
            .query_row("SELECT COUNT(*) FROM workspaces", [], |row| row.get(0))
            .unwrap();
        let notes: i64 = conn
            .query_row("SELECT COUNT(*) FROM notes", [], |row| row.get(0))
            .unwrap();
        assert_eq!(workspaces, 0);
        assert_eq!(notes, 0);
        assert!(load_db_owner_inner(&conn).unwrap().is_none());
    }

    #[test]
    fn profile_sync_does_not_steal_bound_wallet() {
        let conn = memory_db();
        bind_db_owner_inner(
            &conn,
            &json!({"walletAddress": "0x1111111111111111111111111111111111111111"}),
        )
        .unwrap();
        sync_db_owner_from_profile(
            &conn,
            &json!({"walletAddress": "0x2222222222222222222222222222222222222222"}),
        )
        .expect("skip");
        let loaded = load_db_owner_inner(&conn).unwrap().unwrap();
        assert_eq!(
            loaded["walletAddress"],
            "0x1111111111111111111111111111111111111111"
        );
    }

    #[test]
    fn db_owner_fills_missing_public_key() {
        let conn = memory_db();
        bind_db_owner_inner(
            &conn,
            &json!({"walletAddress": "0x1111111111111111111111111111111111111111"}),
        )
        .unwrap();
        bind_db_owner_inner(
            &conn,
            &json!({
                "walletAddress": "0x1111111111111111111111111111111111111111",
                "publicKey": "0x04aabb"
            }),
        )
        .unwrap();
        let loaded = load_db_owner_inner(&conn).unwrap().unwrap();
        assert_eq!(loaded["publicKey"], "0x04aabb");
    }

    #[test]
    fn upsert_note_stamps_wallet_address_from_db_owner() {
        let conn = memory_db();
        bind_db_owner_inner(
            &conn,
            &json!({"walletAddress": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}),
        )
        .unwrap();
        save_snapshot_inner(
            &conn,
            Snapshot {
                workspaces: vec![json!({"id": "w1", "name": "A"})],
                items: vec![json!({"id": "n1", "workspaceId": "w1", "title": "T", "type": "document"})],
                profile: json!({"walletAddress": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}),
                ..Snapshot::default()
            },
        )
        .expect("shell");
        upsert_note(&conn, "n1", &json!({"title": "T", "content": "body", "workspaceId": "w1"})).unwrap();
        let data: String = conn
            .query_row("SELECT data FROM notes WHERE id = 'n1'", [], |row| row.get(0))
            .unwrap();
        let parsed: Value = serde_json::from_str(&data).unwrap();
        assert_eq!(
            parsed["walletAddress"],
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        );
    }
}
