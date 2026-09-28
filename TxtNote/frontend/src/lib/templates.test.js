import test from "node:test";
import assert from "node:assert/strict";
import {
  createTemplateSeed,
  filterTemplates,
  sanitizeTemplateIds,
  templateById,
  TEMPLATES,
} from "./templates.js";

test("template ids stay unique", () => {
  const ids = TEMPLATES.map((template) => template.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("template search checks Turkish names and descriptions", () => {
  assert.deepEqual(
    filterTemplates(TEMPLATES, "günlük", "discover").map((template) => template.id),
    ["daily-todo", "daily-journal"],
  );
  assert.deepEqual(
    filterTemplates(TEMPLATES, "kavramları", "learning").map((template) => template.id),
    ["mapped-note"],
  );
});

test("pinned template ids are validated and deduplicated", () => {
  assert.deepEqual(
    sanitizeTemplateIds(["flashcards", "missing", "flashcards", "normal-todo"]),
    ["flashcards", "normal-todo"],
  );
});

test("flashcards template opens an empty deck", () => {
  const seed = createTemplateSeed("flashcards");
  assert.equal(templateById("flashcards").noteType, "flashcards");
  assert.deepEqual(seed.flashcards, { cards: [] });
  assert.equal(seed.content, undefined);
});

test("daily todo seed creates fresh task ids", () => {
  const first = createTemplateSeed("daily-todo");
  const second = createTemplateSeed("daily-todo");
  assert.equal(first.todos.length, 3);
  assert.notEqual(first.todos[0].id, second.todos[0].id);
  assert.equal(first.todoDaily, true);
  assert.equal(first.todoPlan.persistent, false);
  assert.equal(Object.values(first.todoPlan.days)[0].length, 3);
});
