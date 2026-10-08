import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, HeightRule, BorderStyle } from "../../../../TxtNote/frontend/node_modules/docx/build/index.mjs";
import { writeFileSync } from "node:fs";
const B = { style: BorderStyle.SINGLE, size: 6, color: "888888" };
const borders = { top: B, bottom: B, left: B, right: B, insideHorizontal: B, insideVertical: B };
const make = (name, { height, margin, line = 240, noBorder }) => {
  const rows = Array.from({ length: 12 }, (_, i) => new TableRow({ cantSplit: true, ...(height ? { height: { value: height, rule: HeightRule.ATLEAST } } : {}), children: [0, 1, 2].map(() => new TableCell({ ...(margin !== undefined ? { margins: { top: margin, bottom: margin, left: 160, right: 160 } } : {}), children: [new Paragraph({ spacing: { before: 0, after: 0, line, lineRule: "auto" }, children: [new TextRun({ text: "Madde " + i, font: "Times New Roman", size: 24 })] })] })) }));
  const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun({ text: "Top", font: "Times New Roman", size: 24 })] }), new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBorder ? undefined : borders })] }] });
  return Packer.toBuffer(doc).then((b) => writeFileSync(`probe/${name}.docx`, b));
};
await make("v0_h531_m120", { height: 531, margin: 120 });
await make("v1_noh_m120", { margin: 120 });
await make("v2_h531_m0", { height: 531, margin: 0 });
await make("v3_noh_m0", { margin: 0 });
await make("v4_h531_nomar", { height: 531 });
await make("v5_h531_m120_line276", { height: 531, margin: 120, line: 276 });
