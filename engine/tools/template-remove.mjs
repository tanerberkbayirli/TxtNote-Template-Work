#!/usr/bin/env node
// Remove one or more templates from the engine, whichever way they were added (orchestration/motor/ALTYAPI.md, "Üretim hattı").
//
// usage: node engine/tools/template-remove.mjs <template-id> [...] [--write] [--root <repo>]
//
// Without --write nothing is changed: the tool prints what it would delete or rewrite. --root points at another copy of the
// repository (the tests use a temporary one).
//
// Two kinds of template exist; the tool finds out which one an id is:
//   generated   engine/src/templates/generated/<id>.js (drafts from engine/tools/taslak/install-template-draft.mjs).
//               Deleted: the module and the JSON it imports; generated/index.js is rebuilt.
//   registered  one line of THESIS_TEMPLATE_REGISTRY in engine/src/registry.js that loads engine/src/templates/<module>.js
//               (engine/tools/template-add.mjs prints that line; a person pastes it).
//               Deleted: the registry line, that variant's JSON and its part of the module; when the module serves no other
//               variant the module file goes too.
// Left alone, but listed so a person decides: the source evidence under engine/specs and engine/references, and every other file
// that still names the id (tests, fixtures). A removed id that is still named in a test fails that test.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(here, "..", "..");
const { remove: removeGenerated, reindex } = await import(pathToFileURL(path.join(here, "taslak", "install-template-draft.mjs")).href);

const SCAN_DIRS = [["engine", "src"], ["engine", "tools"], ["engine", "specs"], ["engine", "references"], ["TxtNote", "frontend", "src"], ["TxtNote", "frontend", "tests"], ["TxtNote", "services"]];
const SKIP_DIRS = new Set(["node_modules", "generated", "python-packages", "runtime-packages", "measurement-packages", "__pycache__", "runtime-wheels"]);

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(m?js|jsx|ts|tsx|json|py|md)$/.test(entry.name)) yield full;
  }
}

/** Files (relative to the repository) that still contain the id. */
export function remainingReferences(root, id) {
  const hits = [];
  for (const parts of SCAN_DIRS) {
    for (const file of walk(path.join(root, ...parts))) {
      if (fs.statSync(file).size > 3_000_000) continue;
      if (fs.readFileSync(file, "utf8").includes(id)) hits.push(path.relative(root, file).split(path.sep).join("/"));
    }
  }
  return hits.sort();
}

const rel = (root, file) => path.relative(root, file).split(path.sep).join("/");
const registryLine = (lines, id) => lines.findIndex((line) => line.includes(`id: "${id}"`) && line.includes("load:"));

/**
 * Work out what removing `id` involves. Returns { kind, steps } or { kind: null }; `apply()` performs the steps.
 * A registered template's module is rewritten only for the shape the tools write: `import <v> from "<json>"`, `const <name> = <v>`,
 * `export { … }`, `export default <name>`; any other shape is left as it is and reported.
 */
export function planRemoval(root, id) {
  const generatedDir = path.join(root, "engine", "src", "templates", "generated");
  const generatedModule = path.join(generatedDir, `${id}.js`);
  if (fs.existsSync(generatedModule)) {
    const json = fs.readFileSync(generatedModule, "utf8").match(/from "([^"]+\.json)"/)?.[1];
    const jsonFile = json ? path.resolve(generatedDir, json) : null;
    return {
      kind: "generated",
      steps: [
        `sil: ${rel(root, generatedModule)}`,
        ...(jsonFile ? [`sil: ${rel(root, jsonFile)}`] : []),
        "yeniden yaz: engine/src/templates/generated/index.js",
      ],
      apply: () => { removeGenerated(id, generatedDir); reindex(generatedDir); },
    };
  }

  const registryFile = path.join(root, "engine", "src", "registry.js");
  const registryText = fs.readFileSync(registryFile, "utf8");
  const lines = registryText.split("\n");
  const index = registryLine(lines, id);
  if (index < 0) return { kind: null, steps: [] };
  const load = lines[index].match(/import\("\.\/templates\/([^"]+\.js)"\)\.then\(\(?module\)? => \(\{ default: module\.(\w+) \}\)\)/);
  if (!load) return { kind: "registered", steps: [`kayıt satırı bulundu ama yükleme biçimi tanınmadı; yalnız satır silinir: engine/src/registry.js:${index + 1}`], apply: () => writeRegistry(registryFile, lines, index), unrecognised: true };
  const [, moduleName, exportName] = load;
  const moduleFile = path.join(root, "engine", "src", "templates", moduleName);
  const otherUsers = lines.filter((line, i) => i !== index && line.includes(`./templates/${moduleName}"`)).length;
  const steps = [`sil: kayıt satırı engine/src/registry.js:${index + 1}`];
  let rewrite = null;
  if (!fs.existsSync(moduleFile)) {
    steps.push(`uyarı: modül yok: engine/src/templates/${moduleName}`);
  } else {
    const source = fs.readFileSync(moduleFile, "utf8");
    const alias = source.match(new RegExp(`^const ${exportName} = (\\w+);\\s*$`, "m"))?.[1];
    const json = alias && source.match(new RegExp(`^import ${alias} from "([^"]+\\.json)"`, "m"))?.[1];
    if (!alias || !json) {
      steps.push(`uyarı: modülün biçimi tanınmadı, elle düzeltilmeli: engine/src/templates/${moduleName} (${exportName})`);
    } else {
      const jsonFile = path.resolve(path.dirname(moduleFile), json);
      steps.push(`sil: ${rel(root, jsonFile)}`);
      if (!otherUsers) {
        steps.push(`sil: engine/src/templates/${moduleName} (başka kayıt kullanmıyor)`);
        rewrite = () => { fs.rmSync(moduleFile); fs.rmSync(jsonFile, { force: true }); };
      } else {
        steps.push(`yeniden yaz: engine/src/templates/${moduleName} (${exportName} çıkarılır; ${otherUsers} kayıt kullanmaya devam ediyor)`);
        rewrite = () => {
          fs.rmSync(jsonFile, { force: true });
          let next = source
            .replace(new RegExp(`^import ${alias} from "[^"]+" with \\{ type: "json" \\};\\r?\\n`, "m"), "")
            .replace(new RegExp(`^const ${exportName} = ${alias};\\r?\\n`, "m"), "");
          const names = (next.match(/^export \{ ([^}]*) \};/m)?.[1] ?? "").split(",").map((n) => n.trim()).filter((n) => n && n !== exportName);
          next = next.replace(/^export \{[^}]*\};\r?\n/m, `export { ${names.join(", ")} };\n`);
          next = next.replace(/^export default \w+;/m, `export default ${names[0]};`);
          fs.writeFileSync(moduleFile, next);
        };
      }
    }
  }
  return { kind: "registered", steps, apply: () => { writeRegistry(registryFile, lines, index); rewrite?.(); } };
}

function writeRegistry(file, lines, index) {
  const next = lines.filter((_, i) => i !== index);
  fs.writeFileSync(file, next.join("\n"));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const rootIndex = args.indexOf("--root");
  const root = rootIndex >= 0 ? path.resolve(args[rootIndex + 1]) : defaultRoot;
  const ids = args.filter((arg, i) => !arg.startsWith("--") && (rootIndex < 0 || i !== rootIndex + 1));
  if (!ids.length) { console.error("kullanım: template-remove.mjs <şablon-kimliği> [...] [--write] [--root <depo>]"); process.exit(2); }
  let missing = 0;
  for (const id of ids) {
    const plan = planRemoval(root, id);
    if (!plan.kind) { console.error(`${id}: kayıtlı ya da üretilmiş şablon değil`); missing += 1; continue; }
    console.log(`${id} (${plan.kind === "generated" ? "üretilmiş taslak" : "kayıtlı"}):`);
    for (const step of plan.steps) console.log(`  ${step}`);
    if (write) plan.apply();
  }
  for (const id of ids) {
    const refs = remainingReferences(root, id);
    if (refs.length) console.log(`${id}: ${write ? "hâlâ anılıyor" : "şu dosyalar kimliği anıyor"} (karar kişinin):\n${refs.map((r) => `  ${r}`).join("\n")}`);
  }
  if (!write && ids.length > missing) console.log("\nHiçbir şey değişmedi; uygulamak için --write ekleyin.");
  if (missing) process.exitCode = 1;
}
