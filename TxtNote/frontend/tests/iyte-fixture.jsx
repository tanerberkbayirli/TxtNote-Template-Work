import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThesisCreator } from "../src/features/templates/ThesisCreator.jsx";
import { ThesisEditor } from "../src/features/editor/ThesisEditor.jsx";
import { resolveThesisTemplate } from "../../../engine/src/registry.js";
import { createThesisDocument } from "../../../engine/src/document.js";
import { prepareThesisNote } from "../../../engine/src/contentModel.js";
import "../src/index.css";
const key = "iyte-ui-verification";
function Fixture() {
  const [doc, setDoc] = useState(() => JSON.parse(localStorage.getItem(key) || "null"));
  const patch = next => setDoc(current => {
    const updated = prepareThesisNote({ ...current, ...next });
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  });
  window.iyteTest = { getDoc: () => doc };
  const create = async selection => {
    const { template, fallback } = await resolveThesisTemplate(selection);
    if (fallback) throw new Error("Unexpected template fallback");
    const next = { title: "", content: "", researchData: { thesis: createThesisDocument(template, selection) } };
    localStorage.setItem(key, JSON.stringify(next)); setDoc(next);
  };
  return doc ? <div style={{ height: "100vh" }}><ThesisEditor {...doc} onDocumentChange={patch} onTitleChange={title => patch({ title })} onContentChange={content => patch({ content })} onResearchDataChange={researchData => patch({ researchData })} /></div> : <ThesisCreator onCreate={create} />;
}
createRoot(document.getElementById("root")).render(<Fixture />);
