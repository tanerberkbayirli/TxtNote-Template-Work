/** Small output regressions; prose deliberately contains no thesis claims. */
export function mcbuOutputFixture(template, { populated = false } = {}) {
  const medical = template.degreeType === 'specialization';
  const legacy = template.id.startsWith('cbu-');
  const main = medical
    ? template.validation.main.headingSequence.map((group, i) => `<h1>${Array.isArray(group) ? group[0] : group}</h1><p>Birinci örnek paragraf${i < 2 ? ` (${i + 1})` : ''}.</p><p><br></p><p>İkinci örnek paragraf.</p>`).join('')
    : '<h1>Kuramsal Çerçeve</h1><p>Birinci örnek paragraf.</p><p><br></p><p>İkinci örnek paragraf.</p><h2>Araştırma düzeni</h2><p>Örnek açıklama.</p><h1>Sonuç ve Öneriler</h1><p>Sonuç bölümü için örnek metin.</p>';
  const figure = '<figure><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAA8CAIAAAAfXYiZAAAAtUlEQVR4nO3bMQqEQBQFQf/i/a88BpuJwTRmUpUJmjRPNJlZax3s+W3eh1iNZQViBeftembK4x93+/pZ1otl/fmfmKc3zLICsQKxArECsQKxArECsQKxArECsQKxArECsQKxArECsQKxArECsQKxArECsQKxArECsQKxArECsQKxArECsQKxArECsQKxArECsQKxArECsQKxArECsQKxXp8Kc+rwkWUF42jhPssKxArECsQ69l28vwx6V9lD9AAAAABJRU5ErkJggg==" width="100" height="60"><figcaption>Örnek şekil açıklaması</figcaption></figure>';
  return {
    title: 'CBÜ biçim doğrulama örneği',
    content: main + (populated ? figure + '<table><caption>Örnek tablo açıklaması</caption><tr><th>Alan</th><th>Değer</th></tr><tr><td>Örnek</td><td>1</td></tr></table>' : ''),
    researchData: { thesis: {
      templateId: template.id, templateVersion: template.templateVersion,
      selection: { universityId: template.universityId, instituteId: template.instituteId, degreeType: template.degreeType, language: template.language },
      values: { YEAR: '2026', STUDENT_NAME: 'Taner Berk Bayırlı', DEPARTMENT_NAME: 'Eğitim Bilimleri', DEPARTMENT_NAME_EN: 'Educational Sciences', PROGRAM_NAME: 'Eğitim Bilimleri', ADVISOR_TITLE: 'Doç. Dr.', ADVISOR_NAME: 'İlknur Çiçek', THESIS_TITLE_EN: 'Formatting verification example', KEYWORDS: 'yapı, biçim, sayfa, dizin, tez', KEYWORDS_EN: 'structure, format, page, index, thesis', PAGE_COUNT: '999' },
      sectionContent: {
        introduction: '<p>Giriş için birinci örnek paragraf.</p><p>&nbsp;</p><p>Giriş için ikinci örnek paragraf.</p>',
        abstract: '<p>Türkçe özet için örnek metin.</p>',
        [legacy ? 'english-abstract' : 'abstract-en']: '<p>Sample text for the English abstract.</p>',
        [legacy ? 'acknowledgements' : 'preface']: '<p>Önsöz için örnek metin.</p>',
        [legacy ? 'list-of-abbreviations' : 'symbols']: '<p>AI = artificial intelligence</p>',
        bibliography: medical ? '<p>1. Örnek A. Kaynak. 2026.</p><p>2. Örnek B. Kaynak. 2026.</p>' : '<p>Örnek, A. (2026). Kaynak.</p>',
      },
    } },
  };
}
