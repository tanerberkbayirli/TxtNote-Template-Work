import{createServer}from'../../../TxtNote/frontend/node_modules/vite/dist/node/index.js';import{fileURLToPath}from'node:url';
const server=await createServer({root:fileURLToPath(new URL('../../../TxtNote/frontend/',import.meta.url)),cacheDir:fileURLToPath(new URL('./vite-cache-5203/',import.meta.url)),server:{port:5203,strictPort:true,host:'127.0.0.1',hmr:false,watch:null}});
// Config merging can retain the project's watch object when the override is null.
// Closing the watcher explicitly and isolating optimizer cache prevents reloads
// triggered by another Vite server's dependency graph during a long measurement.
await server.watcher.close();await server.listen();server.printUrls();console.log(`PID:${process.pid}; watcher closed:${server.watcher.closed}`);
