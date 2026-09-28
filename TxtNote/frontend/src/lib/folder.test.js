import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ancestorIdsOf,
  canMoveIntoFolder,
  collectSubtree,
  detachChildrenOf,
  filterFolderTree,
  isDescendantOf,
  isFolderItem,
  moveItemBeside,
  moveItemIntoFolder,
  nestWorkspaceItems,
  removeItemFromFolder,
  siblingsOf,
} from "./folder.js";

const folder = (id, extra = {}) => ({
  id,
  type: "folder",
  noteType: "folder",
  isPinned: false,
  ...extra,
});
const note = (id, extra = {}) => ({ id, type: "document", noteType: "standard", isPinned: false, ...extra });

describe("isFolderItem", () => {
  it("recognises folders by type or noteType", () => {
    assert.equal(isFolderItem(folder("a")), true);
    assert.equal(isFolderItem(note("b")), false);
  });
});

describe("nestWorkspaceItems", () => {
  it("keeps pinned roots first and nests children under their folder", () => {
    const items = [
      note("n1"),
      folder("f1", { isPinned: true }),
      note("n2", { parentId: "f1" }),
      note("n3", { isPinned: true }),
    ];
    const tree = nestWorkspaceItems(items);
    assert.deepEqual(
      tree.roots.map((row) => row.id),
      ["f1", "n3", "n1"],
    );
    assert.equal(tree.pinnedRootCount, 2);
    assert.deepEqual(
      tree.childrenByParent.get("f1").map((row) => row.id),
      ["n2"],
    );
  });

  it("nests folders inside folders and reports their depth", () => {
    const items = [folder("f1"), folder("f2", { parentId: "f1" }), note("n1", { parentId: "f2" })];
    const tree = nestWorkspaceItems(items);
    assert.deepEqual(
      tree.roots.map((row) => row.id),
      ["f1"],
    );
    assert.deepEqual(
      tree.childrenByParent.get("f1").map((row) => row.id),
      ["f2"],
    );
    assert.deepEqual(
      tree.childrenByParent.get("f2").map((row) => row.id),
      ["n1"],
    );
    assert.equal(tree.depthById.get("f1"), 0);
    assert.equal(tree.depthById.get("f2"), 1);
    assert.equal(tree.depthById.get("n1"), 2);
  });

  it("pins children to the top of their own folder", () => {
    const items = [
      folder("f1"),
      note("n1", { parentId: "f1" }),
      note("n2", { parentId: "f1", isPinned: true }),
    ];
    const tree = nestWorkspaceItems(items);
    assert.deepEqual(
      tree.childrenByParent.get("f1").map((row) => row.id),
      ["n2", "n1"],
    );
  });

  it("treats orphans as roots", () => {
    const tree = nestWorkspaceItems([note("n1", { parentId: "gone" })]);
    assert.equal(tree.roots[0].id, "n1");
  });

  it("does not vanish items when parentId points at itself", () => {
    const tree = nestWorkspaceItems([note("n1", { parentId: "n1" })]);
    assert.equal(tree.roots[0].id, "n1");
  });

  it("lifts a parent cycle back to the root list instead of hanging", () => {
    const tree = nestWorkspaceItems([
      folder("f1", { parentId: "f2" }),
      folder("f2", { parentId: "f1" }),
    ]);
    assert.deepEqual(
      tree.roots.map((row) => row.id).sort(),
      ["f1", "f2"],
    );
  });

  it("survives a null list", () => {
    const tree = nestWorkspaceItems(null);
    assert.deepEqual(tree.roots, []);
  });
});

describe("ancestors", () => {
  it("walks the chain nearest first and answers descendant questions", () => {
    const items = [folder("f1"), folder("f2", { parentId: "f1" }), note("n1", { parentId: "f2" })];
    assert.deepEqual(ancestorIdsOf(items, "n1"), ["f2", "f1"]);
    assert.equal(isDescendantOf(items, "n1", "f1"), true);
    assert.equal(isDescendantOf(items, "f1", "n1"), false);
  });

  it("ends the walk on a loop", () => {
    const items = [folder("f1", { parentId: "f2" }), folder("f2", { parentId: "f1" })];
    assert.deepEqual(ancestorIdsOf(items, "f1"), ["f2"]);
  });
});

describe("collectSubtree", () => {
  it("keeps a folder and every nested child together", () => {
    const items = [
      folder("f1"),
      note("outside"),
      folder("f2", { parentId: "f1" }),
      note("n1", { parentId: "f2" }),
      note("n2", { parentId: "f1" }),
    ];
    assert.deepEqual(
      collectSubtree(items, "f1").map((item) => item.id),
      ["f1", "f2", "n1", "n2"],
    );
  });
});

describe("move / remove", () => {
  it("files a note into a folder", () => {
    const items = [folder("f1"), note("n1")];
    const moved = moveItemIntoFolder(items, "n1", "f1");
    assert.equal(moved.find((row) => row.id === "n1").parentId, "f1");
  });

  it("files a folder into another folder", () => {
    const items = [folder("f1"), folder("f2")];
    assert.equal(canMoveIntoFolder(folder("f2"), folder("f1"), items), true);
    const moved = moveItemIntoFolder(items, "f2", "f1");
    assert.equal(moved.find((row) => row.id === "f2").parentId, "f1");
  });

  it("refuses a folder into its own subtree", () => {
    const items = [folder("f1"), folder("f2", { parentId: "f1" })];
    assert.equal(canMoveIntoFolder(items[0], items[1], items), false);
    assert.equal(moveItemIntoFolder(items, "f1", "f2"), items);
  });

  it("refuses a move into a note", () => {
    const items = [note("n1"), note("n2")];
    assert.equal(canMoveIntoFolder(items[0], items[1], items), false);
  });

  it("unfiles a note and detaches children when the folder is removed", () => {
    const items = [folder("f1"), note("n1", { parentId: "f1" })];
    assert.equal(removeItemFromFolder(items, "n1").find((row) => row.id === "n1").parentId, null);
    assert.equal(detachChildrenOf(items, "f1").find((row) => row.id === "n1").parentId, null);
  });

  it("refuses a move into a missing folder and a missing list", () => {
    assert.deepEqual(moveItemIntoFolder([note("n1")], "n1", "gone"), [note("n1")]);
    assert.deepEqual(moveItemIntoFolder(null, "n1", "f1"), []);
  });
});

describe("moveItemBeside", () => {
  it("moves a row up among its siblings", () => {
    const items = [note("n1"), note("n2"), note("n3")];
    const moved = moveItemBeside(items, "n3", "n1", "before");
    assert.deepEqual(
      moved.map((row) => row.id),
      ["n3", "n1", "n2"],
    );
  });

  it("moves a row down among its siblings", () => {
    const items = [note("n1"), note("n2"), note("n3")];
    const moved = moveItemBeside(items, "n1", "n2", "after");
    assert.deepEqual(
      moved.map((row) => row.id),
      ["n2", "n1", "n3"],
    );
  });

  it("adopts the folder of the row it lands next to", () => {
    const items = [folder("f1"), note("n1", { parentId: "f1" }), note("n2")];
    const moved = moveItemBeside(items, "n2", "n1", "after");
    assert.equal(moved.find((row) => row.id === "n2").parentId, "f1");
    assert.deepEqual(
      moved.map((row) => row.id),
      ["f1", "n1", "n2"],
    );
  });

  it("drops a filed note back to the root when it lands beside a root row", () => {
    const items = [folder("f1"), note("n1", { parentId: "f1" }), note("n2")];
    const moved = moveItemBeside(items, "n1", "n2", "before");
    assert.equal(moved.find((row) => row.id === "n1").parentId, null);
  });

  it("refuses to park a folder next to one of its own children", () => {
    const items = [folder("f1"), note("n1", { parentId: "f1" })];
    assert.equal(moveItemBeside(items, "f1", "n1", "after"), items);
  });

  it("ignores a missing row, itself, and a missing list", () => {
    const items = [note("n1"), note("n2")];
    assert.equal(moveItemBeside(items, "n1", "n1", "before"), items);
    assert.equal(moveItemBeside(items, "n1", "gone", "before"), items);
    assert.deepEqual(moveItemBeside(null, "n1", "n2", "before"), []);
  });
});

describe("siblingsOf", () => {
  it("finds the row's own sibling list", () => {
    const tree = nestWorkspaceItems([folder("f1"), note("n1", { parentId: "f1" }), note("n2")]);
    assert.deepEqual(
      siblingsOf(tree, "n1").map((row) => row.id),
      ["n1"],
    );
    assert.deepEqual(
      siblingsOf(tree, "n2").map((row) => row.id),
      ["f1", "n2"],
    );
  });
});

describe("filterFolderTree", () => {
  it("keeps a folder when a child matches", () => {
    const tree = nestWorkspaceItems([folder("f1"), note("n1", { parentId: "f1" }), note("n2")]);
    const filtered = filterFolderTree(tree, (item) => item.id === "n1");
    assert.deepEqual(
      filtered.roots.map((row) => row.id),
      ["f1"],
    );
    assert.deepEqual(
      filtered.childrenByParent.get("f1").map((row) => row.id),
      ["n1"],
    );
  });

  it("reaches a match nested two folders deep", () => {
    const tree = nestWorkspaceItems([
      folder("f1"),
      folder("f2", { parentId: "f1" }),
      note("n1", { parentId: "f2" }),
      note("n2"),
    ]);
    const filtered = filterFolderTree(tree, (item) => item.id === "n1");
    assert.deepEqual(
      filtered.roots.map((row) => row.id),
      ["f1"],
    );
    assert.deepEqual(
      filtered.childrenByParent.get("f2").map((row) => row.id),
      ["n1"],
    );
    assert.equal(filtered.depthById.get("n1"), 2);
  });

  it("brings the whole subtree along when the folder itself matches", () => {
    const tree = nestWorkspaceItems([
      folder("f1"),
      folder("f2", { parentId: "f1" }),
      note("n1", { parentId: "f2" }),
    ]);
    const filtered = filterFolderTree(tree, (item) => item.id === "f1");
    assert.deepEqual(
      filtered.childrenByParent.get("f2").map((row) => row.id),
      ["n1"],
    );
  });
});
