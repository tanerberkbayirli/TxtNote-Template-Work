/**
 * Drop-target resolution for tiled panes. Covers every outer/inner edge of
 * common layouts: one pane, two columns, two rows, L-shape, 2×2, three columns.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveDropTarget } from "./dropTarget.js";
import { splitNode } from "./layout.js";

const WORK = { x: 0, y: 0, width: 1000, height: 800 };
const G = 0;
const leaf = (id) => ({ kind: "leaf", id, tabId: id });
const split = (id, axis, a, b, ratio = 0.5) => ({ kind: "split", id, axis, ratio, a, b });
const at = (x, y) => ({ x, y });
const hit = (tree, leafId, x, y) => resolveDropTarget(tree, leafId, at(x, y), WORK, G);

describe("single pane", () => {
  const tree = leaf("A");

  it("centre replaces the pane", () => {
    const t = hit(tree, "A", 500, 400);
    assert.equal(t.edge, "center");
    assert.equal(t.nodeId, "A");
  });

  it("each inner edge splits only that pane", () => {
    assert.equal(hit(tree, "A", 150, 400).edge, "left");
    assert.equal(hit(tree, "A", 850, 400).edge, "right");
    assert.equal(hit(tree, "A", 500, 150).edge, "top");
    assert.equal(hit(tree, "A", 500, 650).edge, "bottom");
    assert.equal(hit(tree, "A", 150, 400).nodeId, "A");
  });
});

describe("two columns A | B", () => {
  const tree = split("root", "x", leaf("A"), leaf("B"));

  it("far bottom of A or B wraps the whole pair", () => {
    const fromA = hit(tree, "A", 250, 770);
    const fromB = hit(tree, "B", 750, 770);
    assert.equal(fromA.nodeId, "root");
    assert.equal(fromA.edge, "bottom");
    assert.equal(fromA.scope, "area");
    assert.equal(fromB.nodeId, "root");
    assert.equal(fromB.edge, "bottom");
  });

  it("far top wraps the whole pair", () => {
    assert.equal(hit(tree, "A", 250, 20).nodeId, "root");
    assert.equal(hit(tree, "A", 250, 20).edge, "top");
  });

  it("far left of A puts a full-height pane on the left", () => {
    const t = hit(tree, "A", 30, 400);
    assert.equal(t.nodeId, "root");
    assert.equal(t.edge, "left");
    assert.equal(t.scope, "area");
  });

  it("far right of B puts a full-height pane on the right", () => {
    const t = hit(tree, "B", 970, 400);
    assert.equal(t.nodeId, "root");
    assert.equal(t.edge, "right");
  });

  it("inner bottom of A splits only A (B stays full height)", () => {
    const t = hit(tree, "A", 250, 620);
    assert.equal(t.nodeId, "A");
    assert.equal(t.edge, "bottom");
    assert.equal(t.scope, "pane");
  });

  it("inner top of B splits only B", () => {
    const t = hit(tree, "B", 750, 180);
    assert.equal(t.nodeId, "B");
    assert.equal(t.edge, "top");
  });

  it("gutter side of A splits A to the right", () => {
    const t = hit(tree, "A", 430, 400);
    assert.equal(t.nodeId, "A");
    assert.equal(t.edge, "right");
  });

  it("gutter side of B splits B to the left", () => {
    const t = hit(tree, "B", 570, 400);
    assert.equal(t.nodeId, "B");
    assert.equal(t.edge, "left");
  });

  it("applying far-bottom drop yields a full-width pane under both", () => {
    const target = hit(tree, "A", 250, 770);
    const next = splitNode(tree, target.nodeId, target.edge, "C");
    assert.equal(next.kind, "split");
    assert.equal(next.axis, "y");
    assert.equal(next.b.tabId, "C");
    assert.equal(next.a.id, "root");
    assert.equal(next.a.a.tabId, "A");
    assert.equal(next.a.b.tabId, "B");
  });

  it("centre of A still replaces A", () => {
    const t = hit(tree, "A", 250, 400);
    assert.equal(t.edge, "center");
    assert.equal(t.nodeId, "A");
  });
});

describe("two rows A / B", () => {
  const tree = split("root", "y", leaf("A"), leaf("B"));

  it("far left of either row wraps the whole stack", () => {
    assert.equal(hit(tree, "A", 25, 200).nodeId, "root");
    assert.equal(hit(tree, "A", 25, 200).edge, "left");
    assert.equal(hit(tree, "B", 25, 600).nodeId, "root");
  });

  it("far right wraps the whole stack", () => {
    assert.equal(hit(tree, "A", 980, 200).nodeId, "root");
    assert.equal(hit(tree, "A", 980, 200).edge, "right");
  });

  it("far top of A wraps above both", () => {
    const t = hit(tree, "A", 500, 20);
    assert.equal(t.nodeId, "root");
    assert.equal(t.edge, "top");
  });

  it("far bottom of B wraps below both", () => {
    const t = hit(tree, "B", 500, 780);
    assert.equal(t.nodeId, "root");
    assert.equal(t.edge, "bottom");
  });

  it("inner left of A splits only A", () => {
    const t = hit(tree, "A", 150, 200);
    assert.equal(t.nodeId, "A");
    assert.equal(t.edge, "left");
  });

  it("shared gutter: bottom of A splits only A, top of B splits only B", () => {
    assert.equal(hit(tree, "A", 500, 330).nodeId, "A");
    assert.equal(hit(tree, "A", 500, 330).edge, "bottom");
    assert.equal(hit(tree, "B", 500, 470).nodeId, "B");
    assert.equal(hit(tree, "B", 500, 470).edge, "top");
  });

  it("applying far-left drop yields a full-height pane beside both rows", () => {
    const target = hit(tree, "A", 20, 200);
    const next = splitNode(tree, target.nodeId, target.edge, "C");
    assert.equal(next.axis, "x");
    assert.equal(next.a.tabId, "C");
    assert.equal(next.b.id, "root");
  });
});

describe("L-shape: A|B on top of C", () => {
  const pair = split("pair", "x", leaf("A"), leaf("B"));
  const tree = split("root", "y", pair, leaf("C"));

  it("far bottom of C wraps under the whole layout", () => {
    const t = hit(tree, "C", 500, 780);
    assert.equal(t.nodeId, "root");
    assert.equal(t.edge, "bottom");
    assert.equal(t.scope, "area");
  });

  it("bottom of A near the pair/C gutter wraps A|B (C stays below)", () => {
    const t = hit(tree, "A", 250, 380);
    assert.equal(t.nodeId, "pair");
    assert.equal(t.edge, "bottom");
    assert.equal(t.scope, "group");
  });

  it("inner bottom of A (not at the gutter) splits only A", () => {
    const t = hit(tree, "A", 250, 300);
    assert.equal(t.nodeId, "A");
    assert.equal(t.edge, "bottom");
  });

  it("far left of C wraps left of the whole layout", () => {
    const t = hit(tree, "C", 25, 600);
    assert.equal(t.nodeId, "root");
    assert.equal(t.edge, "left");
  });

  it("far left of A also wraps the whole layout", () => {
    const t = hit(tree, "A", 25, 200);
    assert.equal(t.nodeId, "root");
    assert.equal(t.edge, "left");
  });

  it("applying pair-bottom drop keeps C below a new row under A|B", () => {
    const target = hit(tree, "A", 250, 380);
    const next = splitNode(tree, target.nodeId, target.edge, "D");
    assert.equal(next.axis, "y");
    assert.equal(next.b.tabId, "C");
    assert.equal(next.a.axis, "y");
    assert.equal(next.a.b.tabId, "D");
    assert.equal(next.a.a.id, "pair");
  });
});

describe("L-shape: C left of A/B stack", () => {
  const stack = split("stack", "y", leaf("A"), leaf("B"));
  const tree = split("root", "x", leaf("C"), stack);

  it("far right of A or B wraps right of everything", () => {
    assert.equal(hit(tree, "A", 980, 200).nodeId, "root");
    assert.equal(hit(tree, "A", 980, 200).edge, "right");
    assert.equal(hit(tree, "B", 980, 600).nodeId, "root");
  });

  it("right of C near the gutter wraps the stack on C's right? no — splits C", () => {
    const t = hit(tree, "C", 430, 400);
    assert.equal(t.nodeId, "C");
    assert.equal(t.edge, "right");
  });

  it("left of A near the C|stack gutter wraps the A/B stack", () => {
    const t = hit(tree, "A", 520, 200);
    assert.equal(t.nodeId, "stack");
    assert.equal(t.edge, "left");
    assert.equal(t.scope, "group");
  });
});

describe("2×2 grid", () => {
  const top = split("top", "x", leaf("A"), leaf("B"));
  const bottom = split("bottom", "x", leaf("C"), leaf("D"));
  const tree = split("root", "y", top, bottom);

  it("far left of A or C wraps the whole grid", () => {
    assert.equal(hit(tree, "A", 20, 200).nodeId, "root");
    assert.equal(hit(tree, "C", 20, 600).nodeId, "root");
    assert.equal(hit(tree, "A", 20, 200).edge, "left");
  });

  it("far bottom of C or D wraps under the grid", () => {
    assert.equal(hit(tree, "C", 250, 780).nodeId, "root");
    assert.equal(hit(tree, "D", 750, 780).nodeId, "root");
    assert.equal(hit(tree, "C", 250, 780).edge, "bottom");
  });

  it("bottom of A near the row gutter wraps the top row", () => {
    const t = hit(tree, "A", 250, 380);
    assert.equal(t.nodeId, "top");
    assert.equal(t.edge, "bottom");
    assert.equal(t.scope, "group");
  });

  it("top of D near the row gutter wraps the bottom row", () => {
    const t = hit(tree, "D", 750, 420);
    assert.equal(t.nodeId, "bottom");
    assert.equal(t.edge, "top");
  });

  it("gutter between A and B splits A to the right", () => {
    const t = hit(tree, "A", 430, 200);
    assert.equal(t.nodeId, "A");
    assert.equal(t.edge, "right");
  });
});

describe("three columns A|B|C", () => {
  const left = split("left", "x", leaf("A"), leaf("B"));
  const tree = split("root", "x", left, leaf("C"));

  it("far bottom wraps under all three", () => {
    const t = hit(tree, "A", 200, 770);
    assert.equal(t.nodeId, "root");
    assert.equal(t.edge, "bottom");
  });

  it("far left wraps left of all three", () => {
    assert.equal(hit(tree, "A", 20, 400).nodeId, "root");
    assert.equal(hit(tree, "A", 20, 400).edge, "left");
  });

  it("far right wraps right of all three", () => {
    assert.equal(hit(tree, "C", 980, 400).nodeId, "root");
    assert.equal(hit(tree, "C", 980, 400).edge, "right");
  });

  it("inner bottom of B splits only B", () => {
    const t = hit(tree, "B", 400, 620);
    assert.equal(t.nodeId, "B");
    assert.equal(t.edge, "bottom");
  });
});
