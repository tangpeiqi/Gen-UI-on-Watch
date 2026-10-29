import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadDesignPack } from "./fallback-generator.mjs";
import { createLayoutValidator } from "./layout-validator.mjs";
import { generateOpenAiWatchUi, openAiConfigured, openAiModel } from "./openai-provider.mjs";

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

loadEnvFile(path.join(rootDir, ".env"));

const port = Number(process.env.PORT || 8787);
const designPack = loadDesignPack(rootDir);
const validator = createLayoutValidator(designPack);
const designPackHash = crypto
  .createHash("sha256")
  .update(JSON.stringify({
    runtimeWorkflow: designPack.runtimeWorkflow,
    widgetContentTypes: designPack.widgetContentTypes,
    widgetDesignResources: designPack.widgetDesignResources,
    generationGuide: designPack.generationGuide,
    sampleLayouts: designPack.sampleLayouts,
    circularVisualSpecs: designPack.circularVisualSpecs,
    schema: designPack.schema,
    materialSymbolsRegistry: designPack.materialSymbolsRegistry,
    widgetSelectionPolicy: designPack.widgetSelectionPolicy,
    generatedRectangularWidgetSchema: designPack.generatedRectangularWidgetSchema
  }))
  .digest("hex")
  .slice(0, 12);

const contentTypeByExtension = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, body) {
  const json = JSON.stringify(body, null, 2);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(json);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body is too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function safeFilePath(urlPath) {
  const normalizedPath = decodeURIComponent(urlPath.split("?")[0]);
  const relativePath = normalizedPath === "/" ? "index.html" : normalizedPath.replace(/^\/+/, "");
  const absolutePath = path.resolve(rootDir, relativePath);
  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }
  return absolutePath;
}

function classifyGenerationFailure(error) {
  const message = String(error.message || error).toLowerCase();
  if (/timeout|timed out|abort/.test(message)) return "timeout";
  if (/quota|billing|budget|limit/.test(message)) return "budget_exhausted";
  return "api_failure";
}

function validationFeedbackFrom(validation) {
  const errors = validation.errors?.length ? validation.errors : [];
  return errors.slice(0, 5).map((error) => ({
    code: error.code,
    path: error.path,
    message: error.message
  }));
}

function validationSummaryForLog(validation) {
  const details = validationFeedbackFrom(validation)
    .map((error) => `${error.path}: ${error.message}`)
    .join(" | ");
  return details ? `${validation.summary}: ${details}` : validation.summary;
}

function openAiValidationRetryCount() {
  const configuredRetries = Number(process.env.OPENAI_VALIDATION_RETRIES || 1);
  if (!Number.isFinite(configuredRetries)) return 1;
  return Math.max(0, Math.floor(configuredRetries));
}

function anonymizedContextSummary(context = {}) {
  const combinedText = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  const keywordGroups = {
    workout: /(run|running|walk|workout|gym|exercise|mobility|hike|strength)/,
    weather: /(rain|weather|outside|outdoors|temperature|wind|snow|cloud)/,
    timer: /(timer|countdown|pause|cancel|start|reset)/,
    event: /(dinner|meeting|appointment|pickup|commute|schedule|call|leave)/,
    reminder: /(remind|reminder|todo|to-do|task)/,
    music: /(music|song|playlist|audio|podcast|playback)/,
    checklist: /(checklist|shopping list|task list|packing list)/
  };
  return {
    contextHash: crypto.createHash("sha256").update(JSON.stringify(context)).digest("hex").slice(0, 12),
    hasTimeOfDay: Boolean(context.timeOfDay),
    locationProvided: Boolean(context.location),
    activityLength: String(context.activity || "").length,
    goalLength: String(context.goal || "").length,
    inferredKeywordGroups: Object.entries(keywordGroups)
      .filter(([, pattern]) => pattern.test(combinedText))
      .map(([key]) => key)
  };
}

function selectedWidgetSummary(layout) {
  if (!Array.isArray(layout?.widgets)) return [];
  return layout.widgets.map((widget) => ({
    id: widget.id,
    contentType: widget.contentType,
    shape: widget.shape,
    component: widget.component || null,
    variant: widget.variant || null,
    template: widget.template || null,
    frame: widget.frame
  }));
}

function generationRecordFromResult({ context, result, status, validationAttempts = [], aiValidation = null, failureKind = null }) {
  const layout = result?.layout || null;
  const model = result?.model || {};
  const validation = result?.validation || {};
  return {
    recordVersion: "1.0.0",
    createdAt: new Date().toISOString(),
    endpoint: "/api/generate-watch-ui",
    httpStatus: status,
    provider: layout?.metadata?.provider || model.provider || "unknown",
    model: layout?.metadata?.model || model.model || "unknown",
    promptVersion: layout?.metadata?.promptVersion || model.promptVersion || "unknown",
    schemaVersion: layout?.schemaVersion || model.schemaVersion || designPack.schema.properties.schemaVersion.const,
    designPackHash,
    liveContextSummary: anonymizedContextSummary(context),
    selectedContentTypes: result?.selectedContentTypes || layout?.metadata?.selectedContentTypes || [],
    selectedWidgets: selectedWidgetSummary(layout),
    validation: {
      ok: Boolean(validation.ok),
      stage: validation.stage || "unknown",
      summary: validation.summary || "",
      errors: validation.errors || [],
      warnings: validation.warnings || []
    },
    aiValidation,
    validationAttempts: validationAttempts.map((attempt) => ({
      attempt: attempt.attempt,
      maxAttempts: attempt.maxAttempts,
      responseId: attempt.responseId,
      repairedFromPreviousValidation: attempt.repairedFromPreviousValidation,
      validation: attempt.validation,
      selectedContentTypes: attempt.selectedContentTypes,
      widgetDecisions: attempt.widgetDecisions
    })),
    retryCount: layout?.metadata?.retryCount ?? model.retryCount ?? 0,
    fallback: {
      used: Boolean(layout?.metadata?.fallbackUsed),
      id: layout?.metadata?.fallbackId || null,
      reason: layout?.metadata?.fallbackUsed ? layout?.metadata?.fallbackReason || model.fallbackReason || failureKind || null : null,
      provider: model.fallbackProvider || null,
      model: model.fallbackModel || null
    },
    validationFailureRendered: Boolean(result?.renderInvalidModelResult && !validation.ok),
    acceptedLayout: validation.ok ? layout : null,
    renderedLayout: layout,
    latencyMs: model.latencyMs ?? null,
    estimatedCost: model.estimatedCost || "not-calculated",
    userFeedback: null
  };
}

function appendGenerationRecord(record) {
  if (process.env.DISABLE_GENERATION_RECORDS === "1") return;
  const recordsPath = path.resolve(rootDir, process.env.GENERATION_RECORDS_PATH || "logs/generation-records.jsonl");
  try {
    fs.mkdirSync(path.dirname(recordsPath), { recursive: true });
    fs.appendFileSync(recordsPath, `${JSON.stringify(record)}\n`, "utf8");
  } catch (error) {
    console.warn(`Could not write generation record: ${error.message}`);
  }
}

function sendGenerationResult(response, status, result, options = {}) {
  appendGenerationRecord(generationRecordFromResult({
    context: options.context || {},
    result,
    status,
    validationAttempts: options.validationAttempts || result?.validationAttempts || [],
    aiValidation: options.aiValidation || result?.aiValidation || null,
    failureKind: options.failureKind || null
  }));
  sendJson(response, status, result);
}

function generationFailure(kind, message, logs = [], validation = null) {
  return {
    layout: null,
    error: { kind, message },
    logs: [...logs, { id: "generation", status: "failed", detail: message }],
    validation: validation || { ok: false, stage: "generation", summary: message, errors: [], warnings: [] },
    model: { provider: "openai", model: openAiModel(), fallbackUsed: false }
  };
}

async function handleGenerateWatchUi(request, response) {
  try {
    const rawBody = await readBody(request);
    const body = rawBody ? JSON.parse(rawBody) : {};
    const context = body.context || {};
    const preferences = body.preferences || {};
    const currentTime = body.currentTime || new Date().toISOString();
    if (!openAiConfigured()) {
      const result = generationFailure("model_unavailable", "Model generation is unavailable. Configure the model connection and retry.");
      sendGenerationResult(response, 503, result, { context, failureKind: "model_unavailable" });
      return;
    }

    const openAiLogs = [
      { id: "read-live-context", status: "complete", detail: `time=${context.timeOfDay || "runtime"}; location=${context.location || "unknown"}; activity=${context.activity || "none"}; goal=${context.goal || "none"}` },
      { id: "load-pseudo-context", status: "complete", detail: `Loaded pseudo context timeline for ${designPack.pseudoContextJson.persona?.homeLocation || "demo location"} from the complete JSON context.` }
    ];

    let aiResult;
    let validation;
    let selectedContentTypes = [];
    let widgetDecisions = [];
    const maxValidationRetries = openAiValidationRetryCount();
    let validationFeedback = [];
    const attemptLogs = [];
    const validationAttempts = [];

    for (let attempt = 0; attempt <= maxValidationRetries; attempt += 1) {
      try {
        attemptLogs.push({
          id: "call-openai",
          status: "started",
          detail: `Attempt ${attempt + 1}/${maxValidationRetries + 1}: calling OpenAI Responses API with model=${openAiModel()} and promptVersion=watch-face-phase-9-openai-v1.`
        });
        aiResult = await generateOpenAiWatchUi({
          context,
          preferences,
          designPack,
          currentTime,
          validationFeedback,
          retryCount: attempt
        });
      } catch (error) {
        const kind = classifyGenerationFailure(error);
        const message = kind === "timeout" ? "Model request timed out. Please retry."
          : kind === "budget_exhausted" ? "Model usage limit reached. Please retry later."
          : "Could not reach the model service or complete generation. Please retry.";
        const result = generationFailure(kind, message, [...openAiLogs, ...attemptLogs,
          { id: "call-openai", status: "failed", detail: error.message }]);
        sendGenerationResult(response, kind === "timeout" ? 504 : 503, result, { context, failureKind: kind });
        return;
      }

      validation = validator.validateLayout(aiResult.layout);
      selectedContentTypes = aiResult.selectedContentTypes.length > 0
        ? aiResult.selectedContentTypes
        : aiResult.layout.metadata.selectedContentTypes;
      widgetDecisions = aiResult.widgetDecisions.length > 0
        ? aiResult.widgetDecisions
        : aiResult.layout.widgets.map((widget) => `${widget.contentType} -> ${widget.shape}`);

      attemptLogs.push(
        { id: "call-openai", status: "complete", detail: `Attempt ${attempt + 1}/${maxValidationRetries + 1}: OpenAI returned response ${aiResult.responseId || "without response id"}.` },
        { id: "validate", status: validation.ok ? "accepted" : "failed", detail: `Attempt ${attempt + 1}/${maxValidationRetries + 1}: ${validationSummaryForLog(validation)}` }
      );
      validationAttempts.push({
        attempt: attempt + 1,
        maxAttempts: maxValidationRetries + 1,
        responseId: aiResult.responseId,
        validation,
        selectedContentTypes,
        widgetDecisions,
        repairedFromPreviousValidation: attempt > 0
      });

      if (validation.ok) break;
      validationFeedback = validationFeedbackFrom(validation);
      if (attempt < maxValidationRetries) {
        attemptLogs.push({
          id: "retry-openai",
          status: "started",
          detail: `Retrying OpenAI generation with validation feedback: ${validationFeedback.map((error) => `${error.path}: ${error.message}`).join(" | ")}`
        });
      }
    }

    if (!validation.ok) {
      const result = generationFailure("invalid_output", "Generated layout failed validation. Please retry.", [...openAiLogs, ...attemptLogs], validation);
      result.validationAttempts = validationAttempts;
      sendGenerationResult(response, 422, result, { context, validationAttempts, aiValidation: validation, failureKind: "invalid_output" });
      return;
    }

    const logs = [
      ...openAiLogs,
      ...attemptLogs,
      { id: "select-content-types", status: "complete", detail: selectedContentTypes.join(", ") },
      { id: "choose-widgets", status: "complete", detail: widgetDecisions.join(" | ") },
      { id: "populate-widgets", status: "complete", detail: "OpenAI populated widget data and semantic icon tokens from live context plus pseudo-context data." },
      { id: "generate-layout-json", status: "complete", detail: "OpenAI returned strict structured layout JSON." },
      { id: "validate", status: "accepted", detail: validation.summary },
      { id: "fallback", status: "skipped", detail: "Accepted OpenAI layout; deterministic fallback was not used." },
      { id: "render", status: "pending", detail: "Frontend may render accepted OpenAI layout." }
    ];

    const result = {
      layout: aiResult.layout,
      logs,
      validation,
      selectedContentTypes,
      widgetDecisions,
      pseudoContextSummary: [
        `Loaded pseudo context timeline for ${designPack.pseudoContextJson.persona?.homeLocation || "demo location"}.`,
        "The complete pseudo context JSON is included in the generation prompt."
      ],
      model: {
        ...aiResult.model,
        retryCount: aiResult.layout.metadata.retryCount
      },
      validationAttempts
    };

    sendGenerationResult(response, 200, result, { context, validationAttempts });
  } catch (error) {
    const invalidRequest = error instanceof SyntaxError;
    const result = generationFailure(invalidRequest ? "invalid_request" : "server_error",
      invalidRequest ? "The generation request could not be read. Please retry." : "Generation failed on the server. Please retry.");
    sendGenerationResult(response, invalidRequest ? 400 : 500, result, { failureKind: result.error.kind });
  }
}

function serveStatic(request, response) {
  const filePath = safeFilePath(request.url || "/");
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, { "content-type": "text/plain; charset=utf-8" });
      response.end(error.code === "ENOENT" ? "Not found" : error.message);
      return;
    }
    response.writeHead(200, {
      "content-type": contentTypeByExtension[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    response.end(data);
  });
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url?.startsWith("/api/generate-watch-ui")) {
    handleGenerateWatchUi(request, response);
    return;
  }
  if (request.method === "GET" || request.method === "HEAD") {
    serveStatic(request, response);
    return;
  }
  response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
  response.end("Method not allowed");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Gen UI on Watch simulator: http://127.0.0.1:${port}/`);
  console.log(openAiConfigured()
    ? `POST /api/generate-watch-ui will try OpenAI model ${openAiModel()} without automatic fallback.`
    : "Model generation is unavailable until OPENAI_API_KEY is configured.");
});
