import test from "node:test";
import assert from "node:assert/strict";
import { THESIS_TEMPLATE_REGISTRY } from "./registry.js";

// HE-SB-03 / HE-UI-04: a registry descriptor repeats the identity of its template; the two must agree, and the
// selector needs every institute name.
const IDENTITY = ["id", "templateVersion", "universityId", "universityName", "instituteId", "instituteName", "degreeType", "language", "status"];

test("every registry descriptor matches its template and names its institute", async () => {
  for (const entry of THESIS_TEMPLATE_REGISTRY) {
    const module = await entry.load();
    const template = module.default ?? module;
    for (const key of IDENTITY) assert.equal(entry[key], template[key], `${entry.id}.${key}`);
    assert.ok(String(entry.instituteName || "").trim(), `${entry.id}: instituteName`);
  }
});
