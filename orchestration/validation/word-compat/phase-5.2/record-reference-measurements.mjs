import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const [narrowReportArg, wideReportArg, outputArg] = process.argv.slice(2);
if (!narrowReportArg || !wideReportArg || !outputArg) {
  throw new Error('usage: node record-reference-measurements.mjs <narrow-report.json> <wide-report.json> <output.json>');
}
const sha256 = async (path) => createHash('sha256').update(await readFile(path)).digest('hex');
const readJson = async (path) => JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
const corpusPath = resolve(here, 'corpus.json');
const corpus = await readJson(corpusPath);
const narrowReportPath = resolve(root, narrowReportArg);
const wideReportPath = resolve(root, wideReportArg);
const narrow = await readJson(narrowReportPath);
const wide = await readJson(wideReportPath);
const runDir = resolve(here, 'corpus-reference/run');
const checkMap = new Map([...narrow.checks, ...wide.checks].map((check) => [check.id, check]));
const measuredCases = corpus.cases.map((item) => {
  const lineBreaks = checkMap.get(`${item.id}-line-breaks`);
  const lastLineWords = checkMap.get(`${item.id}-last-line-words`);
  if (!lineBreaks?.actual?.measuredLines || !lastLineWords?.actual?.measuredLastLines) {
    throw new Error(`missing independent measurements for ${item.id}`);
  }
  return {
    ...item,
    reference: {
      lineBreakStatus: lineBreaks.status,
      pdfLines: lineBreaks.actual.measuredLines.pdf,
      wordLines: lineBreaks.actual.measuredLines.word,
      lineBreaksEqual: lineBreaks.status === 'PASS',
      lastLineWordStatus: lastLineWords.status,
      pdfLastLineWordXmm: lastLineWords.actual.measuredLastLines.pdf,
      wordLastLineWordXmm: lastLineWords.actual.measuredLastLines.word,
      maxDeltaMm: lastLineWords.actual.maxDeltaMm,
      bad: lastLineWords.actual.bad,
    },
  };
});

const artifactPaths = [
  ['narrowPdf', resolve(runDir, 'default.pdf')],
  ['narrowDocx', resolve(runDir, 'default.docx')],
  ['narrowWordPdf', resolve(runDir, 'default.word.pdf')],
  ['narrowLayout', resolve(runDir, 'default.layout.json')],
  ['narrowWordRenderInfo', resolve(runDir, 'default.word.render.json')],
  ['widePdf', resolve(runDir, 'wide.pdf')],
  ['wideDocx', resolve(runDir, 'wide.docx')],
  ['wideWordPdf', resolve(runDir, 'wide.word.pdf')],
  ['wideLayout', resolve(runDir, 'wide.layout.json')],
  ['wideWordRenderInfo', resolve(runDir, 'wide.word.render.json')],
  ['fontLocaleEnvironment', resolve(runDir, 'environment.json')],
  ['checksSpec', resolve(root, 'orchestration/specs/phase52-justify.checks.json')],
  ['narrowFixture', resolve(root, 'orchestration/specs/phase52-justify.fixture.json')],
  ['wideFixture', resolve(root, 'orchestration/specs/phase52-justify.fixture.wide.json')],
];
const hashes = Object.fromEntries(await Promise.all(artifactPaths.map(async ([name, path]) => [name, await sha256(path)])));
const narrowWord = await readJson(resolve(runDir, 'default.word.render.json'));
const wideWord = await readJson(resolve(runDir, 'wide.word.render.json'));
const env = await readJson(resolve(runDir, 'environment.json'));
const output = {
  schemaVersion: 1,
  purpose: 'Independent Word-rendered line and last-line word-position reference for the frozen Phase 5.2 corpus. No engine measurement is used as the expected value.',
  corpusSha256: await sha256(corpusPath),
  corpusVersion: corpus.version,
  recordedAt: new Date().toISOString(),
  renderer: {
    wordBuild: narrowWord.build,
    wordVersion: narrowWord.version,
    narrowWordRunPid: narrowWord.pid,
    wideWordRunPid: wideWord.pid,
    printer: narrowWord.activePrinter,
    culture: narrowWord.culture,
    uiCulture: narrowWord.uiCulture,
    fontLocaleEnvironmentSha256: hashes.fontLocaleEnvironment,
    fontFiles: env.fonts,
  },
  provenance: {
    measurementSource: 'Existing conformance.py line_breaks_match and last_line_words_match checks over fresh engine PDF, DOCX, and serialized Word PDFs.',
    wordComRuns: 2,
    originalThreeArialFailuresChanged: false,
    reportArtifacts: { narrow: narrowReportPath, wide: wideReportPath },
    artifactSha256: hashes,
  },
  results: measuredCases,
};
const outputPath = resolve(root, outputArg);
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Recorded ${measuredCases.length} corpus cases; Word ${narrowWord.build}, 2 render runs; ${outputPath}`);
