// Read legacy official sources without opening Word or modifying their packages.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const [packageDirectory] = process.argv.slice(2);
if (!packageDirectory) throw new Error('usage: ege-read-legacy.cjs <temporary word-extractor package directory>');
const Extractor = require(path.resolve(packageDirectory));
const root = path.resolve(__dirname, '../../..');
const archive = path.join(root, 'Butun-Sablonlar/Ege');
async function walk(directory) {
  for (const item of fs.readdirSync(directory, {withFileTypes:true})) {
    const file = path.join(directory,item.name);
    if (item.isDirectory()) { await walk(file); continue; }
    if (!item.name.endsWith('.doc')) continue;
    const relative=path.relative(archive,file).split(path.sep).join('/');
    const key=crypto.createHash('sha256').update(relative).digest('hex').slice(0,16);
    const out=path.join(root,'engine/output/ege-rebuild',key);
    fs.mkdirSync(out,{recursive:true});
    const original=fs.readFileSync(file);
    try {
      const doc=await new Extractor().extract(original);
      const units=[];
      for (const [part,text] of [['ana metin',doc.getBody()],['metin kutusu',doc.getTextboxes()],['dipnot',doc.getFootnotes()],['üst alt bilgi',doc.getHeaders()]]) {
        text.split(/\r?\n/).filter(x=>x.trim()).forEach((text,i)=>units.push({location:`eski Word ${part} paragraf ${i+1}`,text}));
      }
      fs.writeFileSync(path.join(out,'text.json'),JSON.stringify(units,null,1));
      fs.writeFileSync(path.join(out,'text.txt'),units.map(u=>`[${u.location}]\n${u.text}`).join('\n\n'));
      fs.writeFileSync(path.join(out,'legacy.json'),JSON.stringify({method:'word-extractor',sha256:crypto.createHash('sha256').update(original).digest('hex'),characters:doc.getBody().length,formattingMeasured:false},null,1));
      console.log(item.name,doc.getBody().length);
    } catch(error) { console.log('ERROR',item.name,error.message); }
  }
}
walk(archive).catch(error=>{console.error(error);process.exitCode=1;});
