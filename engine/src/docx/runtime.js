// The engine still shares application helpers that create docx components.
// Resolve through the application's runtime to preserve component identity in Node.
export * from "../../../TxtNote/frontend/src/lib/docxRuntime.js";
