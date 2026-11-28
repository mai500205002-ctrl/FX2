# BE-01 Backend Architecture and Execution Map

Review date: 2026-11-28<br>
Repository: mai500205002-ctrl/FX2<br>
Branch / HEAD inspected: `main` / `fa6192628e08d6f7064851328e75dad802b196a0`<br>
Project directory: `Fxfx-main/backend/`<br>
Review type: Static source inspection. No production code or tests were changed. No runtime API calls were made.

## 1. Runtime entrypoint and request flow

`backend/src/index.ts` imports the generation modules, Gateway, and three routers, constructs and exports the Express `app`, and starts the server only when run as the main module. Startup binds to `127.0.0.1`. Middleware is registered in this order:

1. CORS allowlist from `CORS_ORIGIN`.
2. Security response headers.
3. JSON body parser with a 512 KiB limit.
4. General rate limiter (120 requests/minute; health paths skipped).
5. Session POST limiter (10 per 15 minutes).
6. `/api` authentication boundary.
7. Request ID, access logging, and route metrics.
8. Direct handlers, then mounted routers, then the global error handler.

Direct routes in `index.ts`:

| Method and path | Implemented behavior |
|---|---|
| `GET /healthz`, `GET /health` | Health JSON. |
| `POST /agent/run` | Retired compatibility endpoint; returns 410 and points to `/api/agent/run`. |
| `POST /llm` | Validates and sanitizes text, applies policy checks, creates a Gateway budget context, then generates text through the Gateway. Has an additional 60/minute limiter. |
| `GET /api/system-prompt` | Returns the current lateral-thinking prompt and version. |
| `POST /api/insight` | Validates brief, generates insight, optionally attaches browser evidence, returns generation provenance. |
| `POST /api/concept` | Maps a supplied insight to one concept. |
| `POST /api/script` | Writes a script from a supplied concept. |
| `POST /api/full-pipeline` | Sequentially runs insight, concept, then script; it does not invoke the Agent orchestrator, Court, script review, memory, or the other Agent stages. |
| `/api/agent/*` | Mounted Agent router (listed below). |
| `/api/saas/*` | Mounted SaaS router. |
| `/api/browser/*` | Mounted Browser router. |
| `GET /api/metrics` | Returns request metrics and Gateway stats. |
| `GET/POST/DELETE /api/session` | Reports session status, creates a session from a trusted-origin API key, or destroys it. |
| `GET /api/key-status` | Returns provider configured-status metadata, not provider keys. |

Mounted router paths are relative to their prefixes:

- Agent (`agent/agent-route.ts`): `GET /status`, `/runs`, `/runs/:runId`, `/runs/:runId/candidates`, `/runs/:runId/events`, `/runs/:runId/approval`, `/audit`; `POST /runs/:runId/approve`, `/runs/:runId/execute-action`, `/run`; `DELETE /runs/:runId`.
- SaaS (`saas/saas-route.ts`): `GET /status`, `/plans`, `/usage/:tenantId`; `POST /register`.
- Browser (`browser/browser-route.ts`): `GET /status`, `/runs/:runId`; `POST /research`; `DELETE /runs/:runId`.

The global `/api` middleware exempts health, key-status, session, and Browser paths. Other API paths use `apiAuthenticationMiddleware`: with `TEXTFX_API_KEY` set, it accepts a matching bearer value or a valid API session; without the key, `authenticateApi` requires a loopback socket. Browser routes have their own router-level token authorization and opt-in/host policy. Agent approval also checks an approver token (or configured API/admin token). `executeConsequentialAction` validates the approval but then explicitly returns an unavailable-executor error; no external action is performed.

## 2. Generation paths

### Insight

`POST /api/insight` and Agent runs call `modules/insight-generator.ts::generateInsight`. It parses brief fields locally, retrieves up to three snippets from `docs/library` using keyword matching (`knowledge-base.ts`), and injects them into the prompt. `lateral-thinking-agent.ts::synthesizeLateralThinking` makes five concurrent model calls (provocation, analogy, random stimulus, opposite thinking, constraint reversal), then model calls for synthesis, the three-voice debate, and visual prompt generation. JSON shape and language are checked locally. `generateInsight` derives fields such as constraints and opportunities from those returned values locally.

`trend-service.ts::getTrends` contains live SerpApi and local seasonal/domain resolvers, but source search found no caller of `getTrends` in `backend/src`. The generation context has optional `currentTrends`, but the route-built contexts do not populate it. Therefore live trend retrieval is implemented as a module, not demonstrated as active in these request flows.

### Concept and script

`modules/concept-mapper.ts::mapConcept` makes one model call and validates required fields. `modules/script-writer.ts::writeScript` makes one model call, optionally adding review notes for a targeted revision, and validates the returned script shape. Both may include browser evidence references passed through the artifact.

The direct `/api/full-pipeline` is the simple three-stage sequential path; it is not equivalent to the richer Agent pipeline.

### Agent orchestrator

`POST /api/agent/run` validates the request in `agent/agent-route.ts`, then calls `agent/agent-service.ts::runAgent`. The service:

1. Applies optional idempotency-key coalescing/replay and checks that a provider is configured.
2. Builds a run record and generation context; optionally loads browser research and labels it as untrusted evidence.
3. Generates an execution plan, then an insight.
4. Retrieves relevant Creative Memory lessons.
5. Calls `discoverConcepts` for up to five lens-specific candidates (the lens loop is sequential); local lexical heuristics score relevance, distinctiveness, completeness, and rank candidates.
6. Calls `metabolizeIdeas` for at most one mutation and one crossover in parallel. Model failures for these operations are recorded as skipped; seed concepts remain.
7. Runs `regulateCreativeEntropy`, a bounded lexical similarity check and at most one regeneration attempt.
8. Calls `judgeConceptCandidates` (model review; backend computes weighted score and validates selection). On failure it records an explicitly labelled heuristic fallback. In the service, fallback candidate decisions are marked blocked.
9. Writes the selected concept's script, reviews it, and performs at most one targeted revision only when a model review requests it.
10. Optionally generates and reviews one shadow script for a non-rejected alternative. This is counterfactual evidence only and does not replace the selected artifact.
11. Records memory/evaluation data, assembles and validates `CreativeIR`, then marks the run done.

The evaluation gate in `agent-service.ts::buildEvaluation` only returns `ready` when the review source is `model`, the reviewer verdict is `ready`, and the score is at least 78. A heuristic review therefore cannot produce a ready evaluation. If browser research was attached, even a ready result is downgraded to `needs-review`.

## 3. Gateway and providers

Generation modules call the `context.provider.generateCreativeText()` interface; the production provider is `gateway` from `gateway/llm-gateway.ts`. `callLLM` handles task labels (`candidate-generation`, `critique`, `final-artifact`, `utility`), output limits, concurrency, request coalescing/cache, budget reservation, call provenance, usage/cost estimates, and provider health. There is a 30-second per-provider timeout. In auto mode, fallback is limited to provider failures marked `safeToFallback`; this is not a general retry policy. Otherwise errors propagate.

`gateway/provider-adapters.ts` implements Gemini plus OpenAI-compatible adapters for OpenAI, OpenRouter, and xAI/Grok. Provider secrets and model configuration are read from server environment variables. No Groq adapter is present.

Routing note: direct `/llm` and pipeline requests default their request budget context to `provider: auto` unless the request selects a provider. Agent runtime records a display mode from `getActiveProviderLabel`, but `runAgentInternal` creates its Gateway budget context without setting `providerId`; actual Agent calls therefore resolve through the Gateway's auto provider order unless another context supplies a selection. The mode label and selected provider for an individual call are not the same piece of state.

Gateway budgets, health, cache, inflight requests, and call history are process-local. They are not shared atomically between multiple backend processes.

## 4. Runs, events, candidate history, and memory

- `agent/agent-service.ts` keeps run records and idempotency/inflight indexes in process memory.
- `agent/agent-run-store.ts` loads and writes run snapshots under `TEXTFX_AGENT_DATA_DIR` (default `process.cwd()/data/agent-state/runs`), appends lifecycle events to `events.jsonl`, and appends idempotency records to `idempotency.jsonl`. On startup, unfinished records are marked interrupted; generation is not resumed automatically.
- `modules/candidate-archive.ts` stores versioned candidate decisions in a local JSON file (default `process.cwd()/data/creative-candidates.json`, or adjacent to configured Creative Memory data). It is distinct from run snapshots and lifecycle events.
- `modules/creative-memory.ts` stores up to 160 lessons and 200 counterfactual evidence records in `TEXTFX_CREATIVE_MEMORY_PATH` (default `process.cwd()/data/creative-memory.json`). Retrieval is local lexical tag overlap, not vector search. Lessons are learned only from model-based script reviews. Failed/invalid persistence is exposed as `volatile` status and an error field rather than treated as durable.
- `core/creative-ir.ts` defines and validates the canonical run artifact. The Agent response retains legacy fields and includes the `creativeIR`.
- Browser research is stored separately as integrity-enveloped JSON under `TEXTFX_BROWSER_DATA_DIR` (default `~/.textfx/browser-research`). Browser extraction is read-only and the evidence remains explicitly untrusted/unreviewed; digest validation proves stored-text integrity, not truth of page claims.
- `saas/saas-state.ts` holds tenants and usage in process-local Maps. Usage tracking increments a fixed estimate; plan limits are metadata, not enforced quotas in the inspected code.

## 5. Error handling and local versus model-backed behavior

Model-backed work includes planning, the five insight techniques and synthesis/debate/visual prompt, concept generation, scripts, Creative Court, script review, metabolism offspring, entropy regeneration, and counterfactual shadow generation/review. Local code performs parsing/validation, heuristic candidate scoring, lexical similarity and memory retrieval, rubric weighting, approval hashing, evidence integrity checks, run-state transitions, and result assembly.

Failure behavior is stage-specific:

- Generation/plan errors generally propagate to the Agent's outer catch, which marks the run failed and rethrows.
- Discovery records individual failed lenses and continues if another lens succeeds; it throws if all lenses fail.
- Metabolism isolates mutation/crossover failures and retains seed candidates.
- Entropy retains the original pool if regeneration fails or does not improve the measured maximum overlap.
- Court and script-review errors use labelled fallbacks; the fallback sources are retained in run output.
- Counterfactual failures are non-fatal and preserve the primary script/review.
- Knowledge retrieval logs a warning and returns no snippets on failure.
- Creative Memory persistence failure is reflected in status; it does not convert an otherwise completed run into a persistence-backed durable guarantee.

## 6. Comparison with existing architecture/report files

- `BACKEND_ARCHITECTURE_MAP.md` and `docs/engineering/FX2_ARCHITECTURE_MAP.md` identify the earlier baseline as `8e7771ef49d8ea0af94b9594488f9b9fe619ce6d`; that is not the inspected HEAD for this BE-01 review. Their review metadata is historical and should not be read as verification of the current commit.
- The prior map's broad distinction between the standalone insight/concept/script UI path and `/api/agent/run` is consistent with the current source; current `App.tsx` call sites use the three separate paths, while `AgentSaaSPanel.tsx` calls `/api/agent/run`.
- The prior map described a strict fallback release invariant as work to add. The current source already gates `ready` on a model review and downgrades browser-evidence runs. This is an observed implementation; it is not a claim that every fallback path has been exhaustively tested here.
- The Trend Service exists, but its `getTrends` entrypoint is not called from `backend/src` in this inspection; current route contexts do not show live trend injection.
- The map's Creative Memory description is broadly consistent, but “durable” is conditional: persistence can be `volatile`, and the stores are local files/process memory, not shared multi-process storage.
- The SaaS router/state are demonstrable demo scaffolding: `billingReady` and `authReady` are false, persistence is reported as `in-memory-demo`, and the inspected state has no durable tenant store or quota enforcement.
- The quality-lab module provides offline aggregation/benchmark functions; no runtime import/call from `backend/src` was found during this inspection.

## 7. Scope and unresolved verification

This is a source-based execution map, not runtime certification, penetration testing, or exhaustive review of every downstream library/provider behavior. No live provider request, deployed environment, multi-process deployment, persistent-state recovery scenario, or full API integration test was run. The existing architecture/report files and test results refer to an older SHA and must be reconciled separately before treating those reports as current baseline evidence.

No BE-02 work or implementation changes were performed.
