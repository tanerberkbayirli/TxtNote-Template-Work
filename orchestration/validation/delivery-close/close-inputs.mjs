import fs from 'node:fs';
const load = target => JSON.parse(fs.readFileSync(`orchestration/specs/${target}.checks.json`, 'utf8'));
const save = (target, rows) => fs.writeFileSync(`orchestration/specs/${target}.checks.json`, JSON.stringify(rows, null, 2) + '\n');
const target = 'aku-isg-tezsiz-proje';
const rows = load(target);
for (const source of ['layout', 'word']) {
  const id = `footer-measured-baseline-${source}`;
  if (!rows.some(row => row.id === id)) rows.push({id, kind:'page_number_attr', params:{source,pages:{label:'roman'},attr:'baseline'},expected:278.799,tolerance:0.25,source:{file:'AKU_Fen_Bilimleri_Is_Guvenligi_Donem_Projesi_Sablonu_2022.doc',locator:'cached official Word render p.5; PAGE baseline 278.799 mm; footer1.xml 11 pt PAGE followed by empty Normal 12 pt paragraph'},evidence:'MEASURED'});
}
save(target,rows);
const felsefe=load('aku-felsefe-lisans');
for(const row of felsefe.filter(row=>row.kind==='line_gap' && row.id.startsWith('cover-gap-'))) {
 const id=row.id.replace('cover-gap-','inner-cover-gap-');
 if(!felsefe.some(existing=>existing.id===id)) felsefe.push({...row,id,params:{...row.params,page:{page:2}}});
}
save('aku-felsefe-lisans',felsefe);
