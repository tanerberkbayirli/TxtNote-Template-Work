const x="<w:p><w:pPr><w:sectPr><w:a/>";
const F="file:///C:/Users/CASPER/Desktop/TxtNote-Template-Work/TxtNote/frontend/node_modules/fflate/esm/browser.js";
const { zipSync, strToU8, strFromU8, unzipSync } = await import(F);
const { finalizeThesisDocx } = await import("file:///C:/Users/CASPER/Desktop/TxtNote-Template-Work/TxtNote/frontend/src/thesis/docx/package.js");
const z = zipSync({"word/document.xml": strToU8("<w:document><w:body>"+x+"</w:body></w:document>")});
const o = await finalizeThesisDocx(new Blob([z]));
console.log(strFromU8(unzipSync(new Uint8Array(await o.arrayBuffer()))["word/document.xml"]));
