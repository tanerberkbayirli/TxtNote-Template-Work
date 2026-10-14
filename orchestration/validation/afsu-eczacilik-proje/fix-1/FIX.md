# afsu-eczacilik-proje fix-1 (real export ecz.pdf/.docx, Word render ecz.word.pdf)
Changed: engine/src/templates/afsu-eczacilik-proje.js only.
- B1 ÖZET/ABSTRACT heading space-after 12 pt (additive). Expected 34.3 pt (12.10 mm) baseline distance as ÖNSÖZ. Measured 12.10 mm (ÖNSÖZ 12.10) editor PDF; Word 12.07 (ÖNSÖZ 12.07). PASS. Following pages shift by +4.23 mm (intended).
- B2 cover + inner cover: "<VALUE> ANABİLİM DALI" in caps (suffix " ANABİLİM DALI", uppercase), fallback "…… ANABİLİM DALI"; approval: "{{DEPARTMENT_NAME}} Ana Bilim Dalı’ndaki" (EK-1.3, "Dalı" is a fixed word so the suffix "’ndaki" needs no vowel harmony). Export: "EĞİTİM BİLİMLERİ ANABİLİM DALI", "Eğitim Bilimleri Ana Bilim Dalı’ndaki". PASS (text check, PDF and Word). DEPARTMENT_NAME label now says enter the name only.
Not touched: B3, B4, B5 (engine).
