use std::fs;
use std::io::Write;

use tauri::{AppHandle, Manager};

pub fn safe_desktop_file_name(file_name: &str) -> Result<&str, String> {
    if file_name.is_empty() || file_name.len() > 180 {
        return Err("geçersiz dosya adı".into());
    }
    if file_name.contains("..") || file_name.contains('/') || file_name.contains('\\') {
        return Err("geçersiz dosya adı".into());
    }
    if !file_name
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || ch == '.')
    {
        return Err("geçersiz dosya adı".into());
    }
    if !file_name.starts_with("txtnote-") {
        return Err("geçersiz dosya adı".into());
    }
    Ok(file_name)
}

#[tauri::command]
pub fn write_desktop_file(app: AppHandle, file_name: String, contents: String) -> Result<String, String> {
    let name = safe_desktop_file_name(&file_name)?;
    if contents.len() > 64 * 1024 * 1024 {
        return Err("yedek çok büyük".into());
    }
    let desktop = app.path().desktop_dir().map_err(|error| error.to_string())?;
    fs::create_dir_all(&desktop).map_err(|error| error.to_string())?;
    let path = desktop.join(name);
    fs::write(&path, contents).map_err(|error| error.to_string())?;
    Ok(path.to_string_lossy().into_owned())
}

fn safe_academic_file_name(name: &str) -> bool {
    !name.is_empty() && name.len() <= 240 && !name.starts_with('.')
        && !name.contains("..")
        && name.chars().all(|ch| ch.is_alphanumeric() || matches!(ch, '-' | '_' | '.'))
        && (name.ends_with(".pdf") || name.ends_with(".docx"))
}

/// Reserve a unique filename atomically; never overwrite an existing document.
#[tauri::command]
pub async fn write_academic_file(app: AppHandle, file_name: String, contents: Vec<u8>) -> Result<String, String> {
    let directory = app.path().download_dir().map_err(|e| e.to_string())?;
    write_academic_bytes(&directory, &file_name, &contents)
}

fn write_academic_bytes(directory: &std::path::Path, file_name: &str, contents: &[u8]) -> Result<String, String> {
    if !safe_academic_file_name(&file_name) { return Err("Geçersiz belge adı".into()); }
    if contents.is_empty() || contents.len() > 128 * 1024 * 1024 { return Err("Belge boş veya çok büyük".into()); }
    fs::create_dir_all(&directory).map_err(|e| e.to_string())?;
    let (stem, extension) = file_name.rsplit_once('.').ok_or("Geçersiz dosya adı")?;
    for index in 0..10000 {
        let name = if index == 0 { file_name.to_owned() } else { format!("{stem}-{index}.{extension}") };
        let path = directory.join(name);
        match fs::OpenOptions::new().write(true).create_new(true).open(&path) {
            Ok(mut file) => {
                if let Err(error) = file.write_all(&contents).and_then(|_| file.sync_all()) {
                    drop(file);
                    let _ = fs::remove_file(&path);
                    return Err(error.to_string());
                }
                return Ok(path.to_string_lossy().into_owned());
            }
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
            Err(error) => return Err(error.to_string()),
        }
    }
    Err("Bu adla çok fazla dosya var. Belge başlığını değiştirin.".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn safe_desktop_file_name_rejects_traversal() {
        assert!(safe_desktop_file_name("../secret.json").is_err());
        assert!(safe_desktop_file_name("secret.json").is_err());
        assert!(safe_desktop_file_name("txtnote-encrypted-db-1.json").is_ok());
    }

    #[test]
    fn academic_names_allow_turkish_and_reject_paths() {
        assert!(safe_academic_file_name("Eğitim-Çalışması.pdf"));
        assert!(safe_academic_file_name("Tez.docx"));
        for name in ["../Tez.pdf", "a/b.pdf", "a\\b.pdf", "a.exe", "", ".pdf", "a:stream.pdf"] {
            assert!(!safe_academic_file_name(name));
        }
    }

    #[test]
    fn academic_binary_save_preserves_bytes_and_existing_files() {
        let dir = std::env::temp_dir().join(format!("txtnote-export-test-{}-{}", std::process::id(), std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
        let pdf = b"%PDF-1.3\n\0\xff";
        let first = write_academic_bytes(&dir, "Türkçe.pdf", pdf).unwrap();
        let second = write_academic_bytes(&dir, "Türkçe.pdf", b"second").unwrap();
        let word = write_academic_bytes(&dir, "Tez.docx", b"PK\x03\x04").unwrap();
        assert_ne!(first, second);
        assert_eq!(fs::read(&first).unwrap(), pdf);
        assert_eq!(fs::read(&second).unwrap(), b"second");
        assert_eq!(fs::read(&word).unwrap(), b"PK\x03\x04");
        assert!(write_academic_bytes(&dir, "../escape.pdf", pdf).is_err());
        assert!(write_academic_bytes(&dir, "empty.pdf", b"").is_err());
        fs::remove_file(first).unwrap();
        fs::remove_file(second).unwrap();
        fs::remove_file(word).unwrap();
        fs::remove_dir(dir).unwrap();
    }
}
