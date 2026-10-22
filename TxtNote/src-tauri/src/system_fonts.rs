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
    const LIBERATION_SERIF: &[(&str, &str)] = &[
        ("normal", "LiberationSerif-Regular.ttf"),
        ("bold", "LiberationSerif-Bold.ttf"),
        ("italic", "LiberationSerif-Italic.ttf"),
        ("bolditalic", "LiberationSerif-BoldItalic.ttf"),
    ];
    const ARIAL: &[(&str, &str)] = &[
        ("normal", "arial.ttf"),
        ("bold", "arialbd.ttf"),
        ("italic", "ariali.ttf"),
        ("bolditalic", "arialbi.ttf"),
    ];
    const CALIBRI: &[(&str, &str)] = &[
        ("normal", "calibri.ttf"),
        ("bold", "calibrib.ttf"),
        ("italic", "calibrii.ttf"),
        ("bolditalic", "calibriz.ttf"),
    ];
    const CAMBRIA_MATH: &[(&str, &str)] = &[("normal", "cambria.ttc")];
    const CONSOLAS: &[(&str, &str)] = &[
        ("normal", "consola.ttf"),
        ("bold", "consolab.ttf"),
        ("italic", "consolai.ttf"),
        ("bolditalic", "consolaz.ttf"),
    ];
    const COURIER_NEW: &[(&str, &str)] = &[
        ("normal", "cour.ttf"),
        ("bold", "courbd.ttf"),
        ("italic", "couri.ttf"),
        ("bolditalic", "courbi.ttf"),
    ];
    const WINGDINGS: &[(&str, &str)] = &[("normal", "wingding.ttf")];
    const WINGDINGS_2: &[(&str, &str)] = &[("normal", "WINGDNG2.TTF")];
    const WINGDINGS_3: &[(&str, &str)] = &[("normal", "WINGDNG3.TTF")];
    const SYMBOL: &[(&str, &str)] = &[("normal", "symbol.ttf")];
    const WEBDINGS: &[(&str, &str)] = &[("normal", "webdings.ttf")];
    const MS_MINCHO: &[(&str, &str)] = &[("normal", "msmincho.ttc")];
    match value.trim().to_ascii_lowercase().as_str() {
        "times new roman" => Some(("Times New Roman", TIMES_NEW_ROMAN)),
        "liberation serif" => Some(("Liberation Serif", LIBERATION_SERIF)),
        "arial" => Some(("Arial", ARIAL)),
        "calibri" => Some(("Calibri", CALIBRI)),
        "cambria math" => Some(("Cambria Math", CAMBRIA_MATH)),
        "consolas" => Some(("Consolas", CONSOLAS)),
        "courier new" => Some(("Courier New", COURIER_NEW)),
        "wingdings" => Some(("Wingdings", WINGDINGS)),
        "wingdings 2" => Some(("Wingdings 2", WINGDINGS_2)),
        "wingdings 3" => Some(("Wingdings 3", WINGDINGS_3)),
        "symbol" => Some(("Symbol", SYMBOL)),
        "webdings" => Some(("Webdings", WEBDINGS)),
        "ms mincho" => Some(("MS Mincho", MS_MINCHO)),
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
                let mut path = directory.join(file);
                // Office cloud fonts are installed for Word without registering
                // in Windows Fonts or Chromium's local-font enumeration.
                if family == "MS Mincho" && !path.is_file() {
                    if let Some(local) = std::env::var_os("LOCALAPPDATA") {
                        let cache = std::path::PathBuf::from(local)
                            .join("Microsoft/FontCache/4/CloudFonts/MS Mincho");
                        let mut candidates: Vec<_> = std::fs::read_dir(cache)
                            .into_iter().flatten().filter_map(Result::ok)
                            .map(|entry| entry.path())
                            .filter(|p| p.extension().and_then(|e| e.to_str()).is_some_and(|e| e.eq_ignore_ascii_case("ttf")))
                            .collect();
                        candidates.sort();
                        if let Some(candidate) = candidates.into_iter().next() { path = candidate; }
                    }
                }
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
    fn only_allows_named_installed_families() {
        assert_eq!(allowlisted_family("Arial").unwrap().0, "Arial");
        assert_eq!(
            allowlisted_family("times new roman").unwrap().0,
            "Times New Roman"
        );
        assert!(allowlisted_family("../arial.ttf").is_none());
        assert!(allowlisted_family("Liberation Sans").is_none());
        assert_eq!(allowlisted_family(" liberation SERIF ").unwrap().1.len(), 4);
        assert_eq!(allowlisted_family("Liberation Serif").unwrap().1[0].1, "LiberationSerif-Regular.ttf");
        assert!(allowlisted_family("../LiberationSerif-Regular.ttf").is_none());
        assert_eq!(allowlisted_family(" CONSolAS ").unwrap().1.len(), 4);
        assert_eq!(allowlisted_family("courier new").unwrap().1.len(), 4);
        assert!(allowlisted_family("../consola.ttf").is_none());
        assert_eq!(allowlisted_family("Wingdings").unwrap().1[0].1, "wingding.ttf");
        assert_eq!(allowlisted_family("wingdings 2").unwrap().0, "Wingdings 2");
        assert_eq!(allowlisted_family("Wingdings 3").unwrap().0, "Wingdings 3");
        assert_eq!(allowlisted_family("symbol").unwrap().0, "Symbol");
        assert_eq!(allowlisted_family("MS Mincho").unwrap().1[0].1, "msmincho.ttc");
        assert!(allowlisted_family("../MS Mincho").is_none());
        assert!(allowlisted_family("../wingding.ttf").is_none());
    }
}
