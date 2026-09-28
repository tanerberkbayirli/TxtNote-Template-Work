mod db;
mod desktop_export;
mod secure_store;
mod system_fonts;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
            }
            let db = db::AppDb::pending(app.handle())?;
            app.manage(db);
            let handle = app.handle().clone();
            let _ = std::thread::Builder::new()
                .name("txtnote-db".into())
                .spawn(move || {
                    let db = handle.state::<db::AppDb>();
                    if let Err(error) = db.warmup() {
                        eprintln!("TxtNote veritabanı ön yükleme başarısız: {error}");
                    }
                });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db::load_shell,
            db::load_notes,
            db::load_snapshot,
            db::load_snapshot_json,
            db::save_snapshot,
            db::save_snapshot_json,
            db::save_note,
            db::append_version,
            db::list_history,
            db::get_version,
            db::write_media,
            db::write_media_chunk,
            db::open_media,
            db::delete_media,
            db::load_db_owner,
            db::bind_db_owner,
            db::wipe_local_database,
            desktop_export::write_desktop_file,
            desktop_export::write_academic_file,
            system_fonts::read_times_new_roman_fonts,
            secure_store::secure_store_secret,
            secure_store::secure_load_secret,
            secure_store::secure_delete_secret,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
