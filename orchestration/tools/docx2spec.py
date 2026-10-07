"""Extract source facts, not template decisions, from an official DOCX.

All locators are one-based XML paths. Missing properties remain missing: Word
defaults, theme fonts and style inheritance are not guessed or flattened.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import posixpath
import re
import time
import xml.etree.ElementTree as ET
import zipfile

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


def qname(name):
    if name.startswith(W):
        return "w:" + name[len(W):]
    if name.startswith(R):
        return "r:" + name[len(R):]
    return name


def paths(root):
    result = {}

    def visit(node, path):
        result[node] = path
        counts = {}
        for child in node:
            counts[child.tag] = counts.get(child.tag, 0) + 1
            visit(child, f"{path}/{qname(child.tag)}[{counts[child.tag]}]")

    visit(root, "/" + qname(root.tag) + "[1]")
    return result


class Part:
    def __init__(self, package, name):
        self.name = name
        self.root = ET.fromstring(package.read(name))
        self.paths = paths(self.root)

    def locator(self, node):
        return self.name + "#" + self.paths[node]

    def tree(self, node):
        """Preserve every property/attribute, including unsupported extensions."""
        if node is None:
            return None
        result = {"tag": qname(node.tag), "locator": self.locator(node),
                  "attributes": {qname(k): v for k, v in sorted(node.attrib.items())}}
        if node.text and node.text.strip():
            result["text"] = node.text
        if len(node):
            result["children"] = [self.tree(child) for child in node]
        return result

    def fact(self, node, attribute, unit=None):
        raw = node.get(W + attribute)
        if raw is None:
            return None
        value = raw
        if unit == "mm":
            value = round(int(raw) * 25.4 / 1440, 6)
        elif unit == "pt":
            value = int(raw) / 2
        return {"value": value, "raw": raw, "unit": unit,
                "evidence": "MEASURED", "locator": self.locator(node) + "/@w:" + attribute}


def properties(part, node, tags):
    return {tag: part.tree(node.find(W + tag)) for tag in tags if node.find(W + tag) is not None}


def sections(part):
    body = part.root.find(W + "body")
    result = []
    # Exclude historical properties inside sectPrChange and deleted content.
    candidates = [p.find(f"{W}pPr/{W}sectPr") for p in body.findall(W + "p")]
    candidates += [body.find(W + "sectPr")]
    for node in candidates:
        if node is None:
            continue
        item = {"index": len(result) + 1, "locator": part.locator(node),
                "properties": part.tree(node), "measurements": {}}
        for tag, attributes in (("pgSz", ("w", "h")),
                                ("pgMar", ("top", "bottom", "left", "right", "header", "footer", "gutter"))):
            element = node.find(W + tag)
            if element is not None:
                item["measurements"][tag] = {key: part.fact(element, key, "mm") for key in attributes
                                                     if element.get(W + key) is not None}
        result.append(item)
    return result


def styles(part):
    result = []
    for node in part.root.findall(W + "style"):
        item = {"id": node.get(W + "styleId"), "type": node.get(W + "type"),
                "default": node.get(W + "default"), "locator": part.locator(node),
                "properties": part.tree(node), "fontSizes": []}
        for size in node.iter():
            if size.tag in (W + "sz", W + "szCs"):
                item["fontSizes"].append(part.fact(size, "val", "pt"))
        result.append(item)
    return result


def tables(part):
    result = []
    for table in part.root.iter(W + "tbl"):
        item = {"locator": part.locator(table),
                "properties": properties(part, table, ("tblPr", "tblGrid")), "rows": []}
        for row in table.findall(W + "tr"):
            row_item = {"locator": part.locator(row), "properties": properties(part, row, ("trPr",)), "cells": []}
            for cell in row.findall(W + "tc"):
                row_item["cells"].append({"locator": part.locator(cell),
                                          "properties": properties(part, cell, ("tcPr",))})
            item["rows"].append(row_item)
        result.append(item)
    return result


def page_fields(part):
    """Track field delimiters, including nested fields and split instructions."""
    result, stack = [], []
    parents = {child: node for node in part.root.iter() for child in node}

    def record(node, instruction):
        if not re.match(r"^\s*PAGE(?:\s|$)", instruction, re.I):
            return
        paragraph = node
        while paragraph is not None and paragraph.tag != W + "p":
            paragraph = parents.get(paragraph)
        result.append({"instruction": instruction.strip(), "locator": part.locator(node),
                       "paragraphProperties": properties(part, paragraph, ("pPr",)) if paragraph is not None else {},
                       "alignmentStatus": "DIRECT_OR_STYLE_REFERENCE; absence is not measured centering"})

    for node in part.root.iter():
        if node.tag == W + "fldSimple":
            record(node, node.get(W + "instr", ""))
        elif node.tag == W + "fldChar":
            kind = node.get(W + "fldCharType")
            if kind == "begin":
                stack.append({"node": node, "text": "", "collect": True})
            elif kind == "separate" and stack:
                stack[-1]["collect"] = False
            elif kind == "end" and stack:
                field = stack.pop()
                record(field["node"], field["text"])
        elif node.tag == W + "instrText" and stack and stack[-1]["collect"]:
            stack[-1]["text"] += node.text or ""
    return result


def extract(path, target):
    path = Path(path)
    if path.suffix.lower() != ".docx":
        raise ValueError("Input must be DOCX; convert legacy DOC once into the source cache first.")
    result = {"schemaVersion": 1, "target": target, "status": "EXTRACTED_XML_ONLY",
              "source": {"file": path.as_posix(), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()},
              "policy": {"evidence": "MEASURED", "locators": "part#one-based XML path",
                         "missingProperties": "UNKNOWN, not inferred Word defaults",
                         "styleInheritance": "Preserved basedOn/docDefaults/theme references; not flattened",
                         "sourceRole": "Official DOCX properties; guide prose is not interpreted"},
              "parts": {}, "sections": [], "styles": [], "tables": [], "pageFields": [],
              "pending": ["Word-render fixed-page text geometry and source-to-render provenance",
                          "Guide/template conflicts and Tier 2 UNKNOWN review",
                          "Engine-key mapping, draft generation and Tier 1 checker pilot"]}
    with zipfile.ZipFile(path) as package:
        names = set(package.namelist())
        document = Part(package, "word/document.xml")
        result["sections"] = sections(document)
        result["tables"] = tables(document)
        for name in sorted(names):
            if name in ("word/document.xml", "word/styles.xml", "word/numbering.xml", "word/settings.xml") or re.fullmatch(r"word/(?:header|footer)\d+\.xml", name):
                result["parts"][name] = {"sha256": hashlib.sha256(package.read(name)).hexdigest()}
        if "word/styles.xml" in names:
            part = Part(package, "word/styles.xml")
            result["styles"] = styles(part)
            result["docDefaults"] = part.tree(part.root.find(W + "docDefaults"))
        else:
            result["pending"].append("Missing styles.xml; effective font/style values UNKNOWN")
        for name, key in (("word/numbering.xml", "numbering"), ("word/settings.xml", "settings")):
            if name in names:
                part = Part(package, name)
                result[key] = part.tree(part.root)
        result["pageFields"] = page_fields(document)
        result["headerFooterRelationships"] = []
        rel_name = "word/_rels/document.xml.rels"
        if rel_name in names:
            rels = ET.fromstring(package.read(rel_name))
            for rel in rels:
                if not rel.get("Type", "").endswith(("/header", "/footer")):
                    continue
                target_path = rel.get("Target", "")
                item = {"id": rel.get("Id"), "type": rel.get("Type"),
                        "target": target_path, "targetMode": rel.get("TargetMode"),
                        "locator": rel_name + "#Relationship[@Id=" + repr(rel.get("Id")) + "]"}
                if rel.get("TargetMode") != "External":
                    # Resolve package-root absolute and relative OPC targets.
                    resolved = posixpath.normpath(target_path.lstrip("/") if target_path.startswith("/") else str(PurePosixPath("word") / target_path))
                    if resolved not in names:
                        raise ValueError(f"Missing header/footer part: {resolved}")
                    item["part"] = resolved
                    part = Part(package, resolved)
                    result["parts"][resolved] = {"sha256": hashlib.sha256(package.read(resolved)).hexdigest()}
                    result["pageFields"].extend(page_fields(part))
                result["headerFooterRelationships"].append(item)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--docx", required=True)
    parser.add_argument("--target", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    started = time.perf_counter()
    try:
        result = extract(args.docx, args.target)
    except (ValueError, OSError, zipfile.BadZipFile, KeyError, ET.ParseError) as error:
        parser.exit(2, f"docx2spec: {error}\n")
    result["extractionSeconds"] = round(time.perf_counter() - started, 6)
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"target": args.target, "out": str(output), "sections": len(result["sections"]),
                      "styles": len(result["styles"]), "tables": len(result["tables"]),
                      "pageFields": len(result["pageFields"]), "seconds": result["extractionSeconds"]}))


if __name__ == "__main__":
    main()
