import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { EventEmitter } from "node:events";

// Exercise the real handler with a stubbed model and no sockets or paid requests.
const root = process.cwd();
let source = fs.readFileSync("scripts/server.mjs", "utf8");
source = source.replace('import http from "node:http";', 'const http = { createServer: () => ({ listen: () => {} }) };');
source = source.replace(/^import \{ generateOpenAiWatchUi, openAiConfigured, openAiModel \}.*$/m,
  'const generateOpenAiWatchUi = (...args) => globalThis.demoModel.generate(...args); const openAiConfigured = () => globalThis.demoModel.configured; const openAiModel = () => "test-model";');
source = source.replace('const __dirname = path.dirname(fileURLToPath(import.meta.url));', `const __dirname = ${JSON.stringify(path.join(root, "scripts"))};`);
source = source.replace(/from "\.\/(.*?)"/g, (_, file) => `from ${JSON.stringify(pathToFileURL(path.join(root, "scripts", file)).href)}`);
source += '\nglobalThis.demoHandler = handleGenerateWatchUi;';
process.env.DISABLE_GENERATION_RECORDS = "1";
globalThis.demoModel = { configured: false };
await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
async function request(body = '{}') {
  const req = new EventEmitter(); req.setEncoding = () => {}; req.destroy = () => {};
  let status, result;
  const res = { writeHead: value => { status = value; }, end: value => { result = JSON.parse(value); } };
  const pending = globalThis.demoHandler(req, res);
  req.emit("data", body); req.emit("end"); await pending;
  return { status, result };
}
let r = await request();
assert.equal(r.status, 503); assert.equal(r.result.error.kind, "model_unavailable"); assert.equal(r.result.layout, null);
for (const [message, kind, status] of [["Request timed out", "timeout", 504], ["Connection failed", "api_failure", 503], ["Quota exceeded", "budget_exhausted", 503]]) {
  globalThis.demoModel = { configured: true, generate: async () => { throw new Error(message); } };
  r = await request(); assert.equal(r.status, status); assert.equal(r.result.error.kind, kind); assert.equal(r.result.layout, null);
}
const sample = JSON.parse(fs.readFileSync("design-pack/sample-layouts.json", "utf8")).layouts[0];
globalThis.demoModel.generate = async () => ({ layout: { ...structuredClone(sample), unexpected: true }, selectedContentTypes: [], widgetDecisions: [], model: { provider: "openai", model: "test-model" } });
r = await request(); assert.equal(r.status, 422); assert.equal(r.result.error.kind, "invalid_output"); assert.equal(r.result.layout, null);
globalThis.demoModel.generate = async () => { const layout = structuredClone(sample); layout.metadata.provider = "openai"; layout.metadata.fallbackUsed = false; return { layout, selectedContentTypes: [], widgetDecisions: [], model: { provider: "openai", model: "test-model" } }; };
r = await request(); assert.equal(r.status, 200); assert.ok(r.result.layout); assert.equal(r.result.layout.metadata.fallbackUsed, false);
r = await request('{'); assert.equal(r.status, 400); assert.equal(r.result.layout, null);
const html = fs.readFileSync("index.html", "utf8");
const handler = html.slice(html.indexOf('async function handleGenerate()'), html.indexOf('retryGeneration.addEventListener'));
assert.ok(!handler.includes('buildPipelineRun('));
assert.ok(handler.includes('Previous result'));
assert.ok(html.includes('Model-generated ·'));
assert.ok(html.includes('Developer preview · No model used'));
console.log('Model-only demo: no configuration, timeout, API error, quota, invalid layout, success, invalid request, and browser fallback guard verified.');
