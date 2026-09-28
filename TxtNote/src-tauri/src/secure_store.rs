//! OS credential store — Windows Credential Manager, macOS Keychain,
//! Linux Secret Service. The private key never lands in SQLite or an app file.

use keyring::Entry;

const SERVICE: &str = "com.txtnote.desktop";

fn entry(account: &str) -> Result<Entry, String> {
    if account.is_empty() || account.len() > 256 {
        return Err("geçersiz kasa hesabı".into());
    }
    if !account
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || ch == '.' || ch == '-' || ch == '_')
    {
        return Err("geçersiz kasa hesabı".into());
    }
    Entry::new(SERVICE, account).map_err(|error| error.to_string())
}

fn is_missing(error: &keyring::Error) -> bool {
    matches!(error, keyring::Error::NoEntry)
}

#[tauri::command]
pub fn secure_store_secret(account: String, secret: String) -> Result<(), String> {
    if secret.is_empty() || secret.len() > 2048 {
        return Err("geçersiz gizli bilgi".into());
    }
    let item = entry(&account)?;
    item.set_password(&secret).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn secure_load_secret(account: String) -> Result<Option<String>, String> {
    let item = entry(&account)?;
    match item.get_password() {
        Ok(secret) => Ok(Some(secret)),
        Err(error) if is_missing(&error) => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
pub fn secure_delete_secret(account: String) -> Result<(), String> {
    let item = entry(&account)?;
    match item.delete_credential() {
        Ok(()) => Ok(()),
        Err(error) if is_missing(&error) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

#[cfg(all(test, target_os = "windows"))]
mod tests {
    use super::*;

    #[test]
    fn native_store_survives_reopening_entry() {
        let account = format!("test.keyring.{}", std::process::id());
        secure_store_secret(account.clone(), "test-only-not-a-wallet-key".into()).unwrap();
        let loaded = secure_load_secret(account.clone());
        secure_delete_secret(account).unwrap();
        assert_eq!(loaded.unwrap().as_deref(), Some("test-only-not-a-wallet-key"));
    }
}
