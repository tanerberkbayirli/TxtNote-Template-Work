use serde::Serialize;

#[derive(Serialize)]
pub struct SystemFont {
    style: &'static str,
    source: String,
    bytes: Vec<u8>,
}

// No caller-supplied paths: this command reads only the four installed TNR faces.
#[tauri::command]
pub async fn read_times_new_roman_fonts() -> Result<Vec<SystemFont>, String> {
    #[cfg(not(target_os = "windows"))]
    return Err("MCBÜ PDF için Windows sistem Times New Roman fontu gerekli.".into());

    #[cfg(target_os = "windows")]
    {
        let root = std::env::var_os("SystemRoot")
            .or_else(|| std::env::var_os("WINDIR"))
            .ok_or("Windows font dizini bulunamadı.")?;
        let directory = std::path::PathBuf::from(root).join("Fonts");
        let mut fonts = Vec::new();
        for (style, file) in [
            ("normal", "times.ttf"),
            ("bold", "timesbd.ttf"),
            ("italic", "timesi.ttf"),
            ("bolditalic", "timesbi.ttf"),
        ] {
            let path = directory.join(file);
            let bytes = std::fs::read(&path)
                .map_err(|error| format!("Times New Roman {style} yüklenemedi ({}): {error}", path.display()))?;
            fonts.push(SystemFont { style, source: path.to_string_lossy().into_owned(), bytes });
        }
        Ok(fonts)
    }
}
