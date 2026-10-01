use serde::Serialize;

#[derive(Serialize)]
pub struct SystemFont {
    family: String,
    style: &'static str,
    source: String,
    bytes: Vec<u8>,
}

fn allowlisted_family(
    value: &str,
) -> Option<(&'static str, &'static [(&'static str, &'static str)])> {
    const TIMES_NEW_ROMAN: &[(&str, &str)] = &[
        ("normal", "times.ttf"),
        ("bold", "timesbd.ttf"),
        ("italic", "timesi.ttf"),
        ("bolditalic", "timesbi.ttf"),
    ];
    const ARIAL: &[(&str, &str)] = &[
        ("normal", "arial.ttf"),
        ("bold", "arialbd.ttf"),
        ("italic", "ariali.ttf"),
        ("bolditalic", "arialbi.ttf"),
    ];
    const CAMBRIA_MATH: &[(&str, &str)] = &[("normal", "cambria.ttc")];
    match value.trim().to_ascii_lowercase().as_str() {
        "times new roman" => Some(("Times New Roman", TIMES_NEW_ROMAN)),
        "arial" => Some(("Arial", ARIAL)),
        "cambria math" => Some(("Cambria Math", CAMBRIA_MATH)),
        _ => None,
    }
}

async fn read_families(requested: Vec<String>) -> Result<Vec<SystemFont>, String> {
    #[cfg(not(target_os = "windows"))]
    {
        let _ = requested;
        return Err(
            "PDF export requires an installed Windows Arial or Times New Roman font.".into(),
        );
    }

    #[cfg(target_os = "windows")]
    {
        let root = std::env::var_os("SystemRoot")
            .or_else(|| std::env::var_os("WINDIR"))
            .ok_or("Windows font directory was not found.")?;
        let directory = std::path::PathBuf::from(root).join("Fonts");
        let mut fonts = Vec::new();
        let mut seen = std::collections::HashSet::new();
        for requested_family in requested {
            let (family, faces) = allowlisted_family(&requested_family).ok_or_else(|| {
                format!("System PDF font family is not allowlisted: {requested_family}")
            })?;
            if !seen.insert(family) {
                continue;
            }
            for &(style, file) in faces {
                let path = directory.join(file);
                let bytes = std::fs::read(&path).map_err(|error| {
                    format!(
                        "{family} {style} font could not be read ({}): {error}",
                        path.display()
                    )
                })?;
                fonts.push(SystemFont {
                    family: family.to_string(),
                    style,
                    source: path.to_string_lossy().into_owned(),
                    bytes,
                });
            }
        }
        Ok(fonts)
    }
}

/// Reads only explicitly allowlisted installed font families, never caller-supplied paths.
#[tauri::command]
pub async fn read_system_pdf_fonts(families: Vec<String>) -> Result<Vec<SystemFont>, String> {
    read_families(families).await
}

/// Single-family form used by template font loaders.
#[tauri::command]
pub async fn read_system_font_family(family: String) -> Result<Vec<SystemFont>, String> {
    read_families(vec![family]).await
}

/// Kept for compatibility with older frontend builds.
#[tauri::command]
pub async fn read_times_new_roman_fonts() -> Result<Vec<SystemFont>, String> {
    read_families(vec!["Times New Roman".to_string()]).await
}

#[cfg(test)]
mod tests {
    use super::allowlisted_family;

    #[test]
    fn only_allows_arial_and_times_new_roman_names() {
        assert_eq!(allowlisted_family("Arial").unwrap().0, "Arial");
        assert_eq!(
            allowlisted_family("times new roman").unwrap().0,
            "Times New Roman"
        );
        assert!(allowlisted_family("../arial.ttf").is_none());
        assert!(allowlisted_family("Liberation Sans").is_none());
    }
}
