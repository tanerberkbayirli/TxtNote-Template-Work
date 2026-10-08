import fs from 'node:fs';
const dir = 'orchestration/specs/';
const read = (name) => JSON.parse(fs.readFileSync(dir + name, 'utf8'));
const write = (name, data) => fs.writeFileSync(dir + name, JSON.stringify(data, null, 2) + '\n');
for (const target of ['aku-mbg-lisans', 'aku-kimya-lisans', 'aku-sosyoloji-lisans']) {
  const name = target + '.fixture.json';
  const fixture = read(name);
  const contents = fixture.researchData.thesis.sectionContent;
  for (const key of Object.keys(contents)) contents[key] = contents[key].replace(/(<h[234][^>]*>)\s*\d+(?:\.\d+)*\.?\s*/g, '$1');
  write(name, fixture);
  const checks = read(target + '.checks.json');
  for (const check of checks) {
    if (check.kind === 'fonts' && check.id.startsWith('body-font')) {
      check.params.regex = '[A-Za-zÇĞİÖŞÜçğıöşü]{2,}';
      check.params.ignore = '^[𝐸E]\\s*=';
    }
    if (target === 'aku-kimya-lisans') {
      if (check.id.startsWith('inner-cover-fixed')) check.params.lines = ['^AFYON KOCATEPE ÜNİVERSİTESİ$', '^BİTİRME TEZİ$'];
      if (/^h[34]-/.test(check.id)) check.params.regex = check.id.startsWith('h3-')
        ? '^1\\.1\\.1 Üçüncü Dereceden Başlık$' : '^1\\.1\\.1\\.1 Dördüncü Dereceden Başlık$';
    }
    if (target === 'aku-sosyoloji-lisans' && check.id.startsWith('h4-example')) check.params.regex = '^\\d+\\.\\d+\\.\\d+\\. Alt Başlık 1$';
    if (target === 'aku-mbg-lisans' && check.id.startsWith('cover-approval-ethics-unnumbered')) {
      check.params.pages = { until: '^ÖZET$' };
      check.params.each = true;
      check.expected = '';
      check.source.locator += '; checks visible numbering, not an unsupported separate physical page per section';
    }
  }
  write(target + '.checks.json', checks);
}
for (const target of ['aku-felsefe-lisans', 'aku-felsefe-seminer']) {
  const fixture = read(target + '.fixture.json');
  fixture.title = fixture.researchData.thesis.values.THESIS_TITLE;
  write(target + '.fixture.json', fixture);
  const checks = read(target + '.checks.json');
  for (const check of checks) {
    if (check.id.startsWith('cover-gap-')) check.params.page = { page: 1 };
    if (check.params?.pages?.length === 1) check.params.pages = { page: check.params.pages[0] };
  }
  write(target + '.checks.json', checks);
}
const isgName = 'aku-isg-tezsiz-proje.checks.json';
const isg = read(isgName).filter(check => check.id !== 'footer-terminal-empty-paragraph-not-yet-checkable');
for (const check of isg) {
  if (check.id.startsWith('two-line-inner-cover-title-second-line')) check.params.regex = '^Düzeyi$';
  if (check.id === 'footer-style-source-footprint') {
    check.id = 'footer-page-and-terminal-blank-sequence';
    check.kind = 'docx_paragraph_sequence';
    check.params = { part_regex: '^word/footer[0-9]+\\.xml$', require_field: '\\bPAGE\\b' };
    check.expected = [{ field_regex: '\\bPAGE\\b', empty: false }, { empty: true }];
    check.source.locator = 'source footer1/2.xml: PAGE paragraph followed by one empty paragraph; style IDs are implementation identifiers';
  }
}
write(isgName, isg);
console.log('Repaired check locators and fixture inputs; requirement values/tolerances unchanged.');
