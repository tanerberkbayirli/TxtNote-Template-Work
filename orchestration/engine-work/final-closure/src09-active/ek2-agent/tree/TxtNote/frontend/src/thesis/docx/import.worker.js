import { importThesisDocx } from "../importDocx.js";
self.onmessage = async ({ data }) => {
  try { self.postMessage({ document: await importThesisDocx(data.buffer, data.options) }); }
  catch (error) { self.postMessage({ error: error.message, code: error.code }); }
};
