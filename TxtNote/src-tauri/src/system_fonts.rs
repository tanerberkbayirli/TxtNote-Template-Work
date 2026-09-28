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

/// Four installed faces of a template font family. Only families in this fixed list are
/// readable (no caller-supplied file names or paths).
fn family_files(family: &str) -> Option<[(&'static str, &'static str); 4]> {
    match family {
        "Times New Roman" => Some([("normal", "times.ttf"), ("bold", "timesbd.ttf"), ("italic", "timesi.ttf"), ("bolditalic", "timesbi.ttf")]),
        "Arial" => Some([("normal", "arial.ttf"), ("bold", "arialbd.ttf"), ("italic", "ariali.ttf"), ("bolditalic", "arialbi.ttf")]),
        _ => None,
    }
}

#[tauri::command]
pub async fn read_system_font_family(family: String) -> Result<Vec<SystemFont>, String> {
    let files = family_files(&family).ok_or_else(|| format!("{family} için sistem font tanımı yok."))?;
    #[cfg(not(target_os = "windows"))]
    {
        let _ = files;
        return Err(format!("Bu şablonun PDF'i için Windows sistem {family} fontu gerekli."));
    }

    #[cfg(target_os = "windows")]
    {
        let root = std::env::var_os("SystemRoot")
            .or_else(|| std::env::var_os("WINDIR"))
            .ok_or("Windows font dizini bulunamadı.")?;
        let directory = std::path::PathBuf::from(root).join("Fonts");
        let mut fonts = Vec::new();
        for (style, file) in files {
            let path = directory.join(file);
            let bytes = std::fs::read(&path)
                .map_err(|error| format!("{family} {style} yüklenemedi ({}): {error}", path.display()))?;
            fonts.push(SystemFont { style, source: path.to_string_lossy().into_owned(), bytes });
        }
        Ok(fonts)
    }
}
