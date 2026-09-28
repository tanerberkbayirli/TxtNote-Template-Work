/**
 * Pane tree placement: a tab already on screen must not open a second copy.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectTabIds, countLeaves, firstLeaf, makeLeaf, MAX_PANES, placeTabInTree, pruneMissingTabs, setSplitRatio, splitNode } from "./layout.js";

describe("placeTabInTree", () => {
  it("opens the first drop as a split beside the current pane", () => {
    const tree = makeLeaf("A", "pane-a");
    const next = placeTabInTree(tree, "B", { leafId: "pane-a", nodeId: "pane-a", edge: "right" });
    assert.equal(countLeaves(next), 2);
    assert.deepEqual(collectTabIds(next).sort(), ["A", "B"]);
  });

  it("ignores dropping the same tab again", () => {
    const single = makeLeaf("A", "pane-a");
    const split = placeTabInTree(single, "B", { leafId: "pane-a", nodeId: "pane-a", edge: "right" });
    const again = placeTabInTree(split, "B", {
      leafId: split.b.id,
      nodeId: split.b.id,
      edge: "right",
    });
    assert.equal(again, split);
    assert.equal(countLeaves(again), 2);
    assert.equal(collectTabIds(again).filter((id) => id === "B").length, 1);
  });

  it("ignores dropping a tab onto a different pane if it is already visible", () => {
    const a = makeLeaf("A", "pane-a");
    const two = splitNode(a, "pane-a", "right", "B");
    const again = placeTabInTree(two, "A", { leafId: two.b.id, nodeId: two.b.id, edge: "right" });
    assert.equal(again, two);
    assert.equal(collectTabIds(again).filter((id) => id === "A").length, 1);
  });
});

describe("pane limits and ratios", () => {
  it("replaces instead of splitting once MAX_PANES is reached", () => {
    let tree = makeLeaf("t0", "pane-0");
    for (let index = 1; index < MAX_PANES; index += 1) {
      const leaf = tree.kind === "leaf" ? tree : tree.b;
      tree = splitNode(tree, leaf.id, "right", `t${index}`);
    }
    assert.equal(countLeaves(tree), MAX_PANES);
    const target = firstLeaf(tree);
    const next = placeTabInTree(tree, "extra", {
      leafId: target.id,
      nodeId: target.id,
      edge: "right",
    });
    assert.equal(countLeaves(next), MAX_PANES);
    assert.ok(collectTabIds(next).includes("extra"));
    assert.equal(collectTabIds(next).includes("t0"), false);

    const again = placeTabInTree(next, "extra-2", {
      leafId: firstLeaf(next).id,
      nodeId: firstLeaf(next).id,
      edge: "center",
    });
    assert.equal(countLeaves(again), MAX_PANES);
    assert.ok(collectTabIds(again).includes("extra-2"));
  });

  it("clamps a NaN divider ratio instead of poisoning the tree", () => {
    const split = splitNode(makeLeaf("A", "pane-a"), "pane-a", "right", "B");
    const next = setSplitRatio(split, split.id, Number.NaN);
    assert.equal(next.ratio, 0.5);
  });

  it("drops leaves whose tabs are gone", () => {
    const split = splitNode(makeLeaf("A", "pane-a"), "pane-a", "right", "B");
    const pruned = pruneMissingTabs(split, ["B"]);
    assert.equal(pruned.kind, "leaf");
    assert.equal(pruned.tabId, "B");
  });
});
