import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {THESIS_TEMPLATE_REGISTRY,resolveThesisTemplate} from '../registry.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const ledger=read('engine/references/ege-rebuild/coverage.json');
const sources=read('engine/references/ege-rebuild/sources.json');

test('every archived Ege PDF and Word source is inventoried with an unchanged hash',()=>{
  const walk=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.join(directory,item.name)):[path.join(directory,item.name)]);
  const actual=walk(path.join(root,'Butun-Sablonlar/Ege')).filter(file=>/\.(pdf|docx|doc)$/i.test(file) && !path.basename(file).startsWith('~$')).map(file=>path.relative(root,file).split(path.sep).join('/')).sort();
  assert.deepEqual(sources.map(s=>s.path).sort(),actual);
  for(const source of sources){
    assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,source.path))).digest('hex'),source.sha256,source.path);
  }
});

test('rebuilt templates bind their own institute sources and expose open questions',async()=>{
  for(const row of ledger.templates){
    const {template,fallback}=await resolveThesisTemplate({templateId:row.id});
    assert.equal(fallback,false,row.id);
    assert.equal(template.source.archivePath,row.source,row.id);
    if(row.guide) assert.equal(path.dirname(row.guide),path.dirname(row.source),`${row.id}: foreign institute guide`);
    assert.equal(template.status,'generic',row.id);
    assert.ok(template.source.review,row.id);
    if(template.source.rebuildKind==='guide-rules'){
      assert.ok(template.source.review.unknown.some(u=>u.field.startsWith('sections')),`${row.id}: partial layout must remain visible`);
      assert.match(THESIS_TEMPLATE_REGISTRY.find(t=>t.id===row.id).displayName,/Yazım kuralları/);
    }
  }
});

test('source-specific corrections distinguish language, degree and body text from samples',async()=>{
  const loadBySource=async suffix=>{
    const row=ledger.templates.find(t=>t.source.endsWith(suffix));
    assert.ok(row,suffix);
    return (await resolveThesisTemplate({templateId:row.id})).template;
  };
  const phd=await loadBySource('PAU_Saglik_Bilimleri_Doktora_Tez_Sablonu_2023_Haziran.docx');
  assert.equal(phd.typography.body.fontSizePt,12); // guide control list, not the 9pt example paragraph
  const dpu=await loadBySource('DPU_Lisansustu_Tez_Sablonu_2026-09-29.docx');
  assert.equal(dpu.typography.body.align,'justify'); // guide §Paragraflar, not a centred instruction box
  assert.equal((await loadBySource('ADU_Muhendislik_Lisans_Bitirme_Tezi_Sablonu_2018.docx')).language,'en');
  assert.equal((await loadBySource('EGE_Saglik_Bilimleri_Tez_Sablonu_2018.docx')).degreeType,'phd');
  const rawBlocks=template=>JSON.stringify(template.sections.map(s=>s.blocks||[]));
  for(const suffix of ['PAU_Saglik_Bilimleri_Doktora_Tez_Sablonu_2023_Haziran.docx','PAU_Saglik_Bilimleri_Yuksek_Lisans_Tez_Sablonu_2023_Haziran.docx','USAK_Makine_Muh_Ornek_Tez_Rev1_2020.docx']){
    assert.doesNotMatch(rawBlocks(await loadBySource(suffix)),/Gökhan BAYRAK|Damla GÜNDÜZ|Nilgün ULUSOY/);
  }
  const yasar=await loadBySource('Yasar_Lisansustu_Tez_Sablonu_TR_2024-11-19.docx');
  assert.doesNotMatch(rawBlocks(yasar),/DEMATEL|KOBİ’lerde|Kayseri’de/); // published sample abstract is not the user's research
  const tinaztepe=await loadBySource('TINAZTEPE_Lisansustu_Tez_Yazim_Kilavuzu.docx');
  const cover=JSON.stringify(tinaztepe.sections.find(s=>s.type==='outerCover').blocks);
  assert.match(cover,/İZMİR TINAZTEPE ÜNİVERSİTESİ/); // city cleanup must not truncate the university name
  assert.doesNotMatch(cover,/SIRTÖN KAPAK|14 punto|\(5 aralık\)|EK 1\./);
  const medicine=await loadBySource('ADU_Tip_Fakultesi_Tipta_Uzmanlik_Tez_Yazim_Kilavuzu_2023.pdf');
  assert.equal(medicine.page.margins.rightMm,23); // explicit 2.3 cm, not a generic 2.5 cm margin
  assert.equal(medicine.page.numbering.align,'right');
});
