# StructureSPACE bölüm başı boşluğu — 12.10.2026

Sonuç: güncel kodda dört SPACE farkı yeniden üretilemedi; üretim kodu değiştirilmedi.

- Güncel kod, gerçek Chrome + sahip olunan Word örneğiyle `engine-word-structure`: 136 PASS / 0 FAIL, SPACE_A_FIRST, SPACE_A_SECOND, SPACE_B_FIRST, SPACE_A_RETURN, SPACE_NATURAL_TOP, SPACE_FORCED_TOP dahil. Raporlar: `before/check-20261012-1414.json`, `final/check-20261012-1417.json`.
  - SPACE_A_FIRST: PDF 31.767 / Word 31.757 mm (fark 0.01). SPACE_FORCED_TOP: 28.947 / 28.914.
- Editör DOM (`space-regression.mjs`): ilk paragraf 8 pt üst boşluğunu koruyor, SPACE_FORCED_TOP 0; altı paragrafın hepsi forced-top'a göre Word ile 0.1 mm içinde.
- Neden 4 FAIL görülmüştü: yalnız-DOCX deneyi (ilk paragrafın w:before değerini 0 yapmak) Word'ü 28.914'e çekti, PDF/editör 31.767'de kaldı. Gerçek Word, bölüm kesmesiyle başlayan sayfada ilk paragrafın boşluğunu KORUR (bu belgede önceki paragrafın "sonra" boşluğu 0; genel kural: önceki paragrafın sonrası boşluk düşülür), pageBreakBefore sonrasında ise düşürür. Yani doğru davranış "bastırma" değil, mevcut korumadır; geçmişteki PDF 28.947 okuması ise başka bir yazarın sonradan değişen PDF/editör yolundaydı.
- `suppressSpaceBeforeAtPageTop` CSS'inin `.thesis-body > div > .rich-text-body > p` yolunu kapsamaması bu yüzden hata değil: kapsasaydı editör 8 pt kaybeder, Word ile arasında 2.8 mm fark doğardı. Seçici bilinçli olarak genişletilmedi.

Eklenen regresyon kontrolleri
- `TxtNote/frontend/src/lib/thesisSpaceTop.test.js`: DOCX ilk paragraf w:before=160 korunur, forced stil pageBreakBefore taşır; CSS forced stili sıfırlar ve editörün gerçek sarmalayıcısını sıfırlayan kural yoktur.
- `orchestration/engine-work/final-closure/special/space-fix/space-regression.mjs`: gerçek tarayıcıda ilk paragrafın sarmalayıcı arkasında olduğunu, 8 pt/0 pt kenar boşluklarını ve Word farklarını doğrular.
- Tam birim turu: 956/956 PASS.

Açık sorun
- Genel kural (önceki paragrafın "sonra" boşluğu > 0 olduğunda ilk paragrafın boşluğu = before − after) editör/PDF'te uygulanmıyor; bu fixture'da önceki "sonra" 0 olduğu için fark görünmez. SRC09 uzun belgesinde bu kuralın DOCX içe aktarma tarafı (`projection.js`) uygulandı; şablon bölümleri için ayrı ölçüm gerekir. Bu görevde yapılmadı.
- Word için "no cached reference" notu: kaynak referans önbelleği yok, ölçüm gerçek Word render'ıyla yapıldı.
