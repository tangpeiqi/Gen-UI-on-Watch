import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateFallbackWatchUi, loadDesignPack } from "./fallback-generator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), "utf8"));
}

function anonymizedCaseSummary(context) {
  return {
    contextHash: crypto.createHash("sha256").update(JSON.stringify(context)).digest("hex").slice(0, 12),
    hasTimeOfDay: Boolean(context.timeOfDay),
    locationProvided: Boolean(context.location),
    activityLength: String(context.activity || "").length,
    goalLength: String(context.goal || "").length
  };
}

function summarizeResult(result, status, latencyMs) {
  const layout = result?.layout || null;
  const validation = result?.validation || {};
  const validationAttempts = result?.validationAttempts || [];
  return {
    status,
    provider: layout?.metadata?.provider || result?.model?.provider || "unknown",
    model: layout?.metadata?.model || result?.model?.model || "unknown",
    promptVersion: layout?.metadata?.promptVersion || result?.model?.promptVersion || "unknown",
    schemaVersion: layout?.schemaVersion || result?.model?.schemaVersion || "unknown",
    validationOk: Boolean(validation.ok),
    validationSummary: validation.summary || "",
    validationErrorCount: validation.errors?.length || 0,
    validationErrors: validation.errors || [],
    fallbackUsed: Boolean(layout?.metadata?.fallbackUsed),
    fallbackReason: layout?.metadata?.fallbackReason || result?.model?.fallbackReason || null,
    validationFailureRendered: Boolean(result?.renderInvalidModelResult && !validation.ok),
    retryCount: layout?.metadata?.retryCount ?? result?.model?.retryCount ?? 0,
    validationAttemptCount: validationAttempts.length,
    repaired: validationAttempts.some((attempt) => attempt.repairedFromPreviousValidation && attempt.validation?.ok),
    exhaustedRetries: validationAttempts.length > 0 && !validationAttempts.some((attempt) => attempt.validation?.ok),
    selectedContentTypes: result?.selectedContentTypes || layout?.metadata?.selectedContentTypes || [],
    selectedWidgets: Array.isArray(layout?.widgets)
      ? layout.widgets.map((widget) => ({
        contentType: widget.contentType,
        shape: widget.shape,
        component: widget.component || null,
        template: widget.template || null,
        variant: widget.variant || null
      }))
      : [],
    latencyMs,
    estimatedCost: result?.model?.estimatedCost || "not-calculated"
  };
}

function summarizeBatch(results, label) {
  const total = results.length;
  const accepted = results.filter((item) => item.result.validationOk).length;
  const fallbacks = results.filter((item) => item.result.fallbackUsed).length;
  const repaired = results.filter((item) => item.result.repaired).length;
  const exhaustedRetries = results.filter((item) => item.result.exhaustedRetries).length;
  const validationFailureRendered = results.filter((item) => item.result.validationFailureRendered).length;
  const latencies = results.map((item) => item.result.latencyMs).filter((value) => typeof value === "number");
  const averageLatencyMs = latencies.length
    ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
    : 0;
  return {
    label,
    total,
    accepted,
    acceptedRate: total ? accepted / total : 0,
    fallbacks,
    fallbackRate: total ? fallbacks / total : 0,
    repaired,
    exhaustedRetries,
    validationFailureRendered,
    averageLatencyMs
  };
}

function printSummary(summary) {
  console.log(`${summary.label}: ${summary.accepted}/${summary.total} accepted, ${summary.fallbacks} fallback, ${summary.repaired} repaired, ${summary.exhaustedRetries} exhausted, ${summary.validationFailureRendered} invalid-rendered, avg ${summary.averageLatencyMs}ms`);
}

async function runFallbackCase(testCase, designPack) {
  const startedAt = performance.now();
  const result = generateFallbackWatchUi({
    context: testCase.context,
    preferences: {},
    designPack
  });
  return {
    id: testCase.id,
    description: testCase.description,
    contextSummary: anonymizedCaseSummary(testCase.context),
    result: summarizeResult(result, result.validation.ok ? 200 : 422, Math.round(performance.now() - startedAt))
  };
}

async function runEndpointCase(testCase, endpoint) {
  const startedAt = performance.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      context: testCase.context,
      currentTime: new Date().toISOString(),
      preferences: {}
    })
  });
  const result = await response.json();
  return {
    id: testCase.id,
    description: testCase.description,
    contextSummary: anonymizedCaseSummary(testCase.context),
    result: summarizeResult(result, response.status, Math.round(performance.now() - startedAt))
  };
}

async function endpointAvailable(endpoint) {
  try {
    const response = await fetch(endpoint.replace(/\/api\/generate-watch-ui$/, "/"), { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

function writeEvalReport(report) {
  const outputDir = path.join(rootDir, "eval-results");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `watch-ui-eval-${report.runId}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");
  return outputPath;
}

loadEnvFile(path.join(rootDir, ".env"));

const evalSet = readJson("evals/watch-ui-contexts.json");
const designPack = loadDesignPack(rootDir);
const endpoint = process.env.EVAL_ENDPOINT || "http://127.0.0.1:8787/api/generate-watch-ui";
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const fallbackResults = [];
const endpointResults = [];

for (const testCase of evalSet.cases) {
  fallbackResults.push(await runFallbackCase(testCase, designPack));
}

const canUseEndpoint = await endpointAvailable(endpoint);
if (canUseEndpoint) {
  for (const testCase of evalSet.cases) {
    endpointResults.push(await runEndpointCase(testCase, endpoint));
  }
} else {
  console.log(`Endpoint unavailable, skipped backend/OpenAI eval: ${endpoint}`);
}

const report = {
  runId,
  createdAt: new Date().toISOString(),
  evalSet: {
    path: "evals/watch-ui-contexts.json",
    schemaVersion: evalSet.schemaVersion,
    caseCount: evalSet.cases.length
  },
  endpoint: canUseEndpoint ? endpoint : null,
  summaries: [
    summarizeBatch(fallbackResults, "fallback-only"),
    ...(endpointResults.length ? [summarizeBatch(endpointResults, "backend-endpoint")] : [])
  ],
  results: {
    fallbackOnly: fallbackResults,
    backendEndpoint: endpointResults
  },
  notes: [
    "fallback-only runs execute deterministic local generation without OpenAI.",
    "backend-endpoint runs use the current /api/generate-watch-ui server, including OpenAI, repair retries, validation, deterministic fallback for provider failures, and invalid model preview rendering for validation failures."
  ]
};

console.log(`Watch UI eval ${runId}`);
for (const summary of report.summaries) {
  printSummary(summary);
}
const outputPath = writeEvalReport(report);
console.log(`Wrote ${outputPath}`);
