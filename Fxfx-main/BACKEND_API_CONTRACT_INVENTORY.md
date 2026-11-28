# Backend API and Contract Inventory — BE-02

Status: static route and boundary inventory; request/response contracts are not fully verified
Repository: mai500205002-ctrl/FX2
Branch / HEAD inspected: `main` / `fa6192628e08d6f7064851328e75dad802b196a0`
Date: 2026-11-28
Evidence: `backend/src/index.ts`, `agent/agent-route.ts`, `browser/browser-route.ts`, `saas/saas-route.ts`, and `utils/security.ts`.

This is a map of handlers and observed boundaries, not runtime proof or a complete schema specification. `POST /api/full-pipeline` is distinct from the Agent orchestrator. BE-04 must turn this inventory into an executable request/response/error compatibility matrix.

## Direct routes

| Method | Path | Observed behavior / input checks | Auth / side effects / error handling |
|---|---|---|---|
| GET | `/healthz` | Liveness JSON. | Public; global rate limiter skips this health path. Not a readiness/dependency probe. |
| GET | `/health` | Liveness JSON. | Public; global rate limiter skips this health path. |
| POST | `/agent/run` | Retired compatibility handler. | Returns 410 with replacement `/api/agent/run`. |
| POST | `/llm` | Requires string `input`; sanitize and policy checks; accepts optional provider/model via request budget context. | Outside `/api` auth middleware; general and 60/minute LLM limiters apply. Server binds to loopback in normal startup. Provider/budget errors mapped by `sendGenerationError`. |
| GET | `/api/system-prompt` | Returns system prompt and version. | `/api` auth boundary unless the key is unset and socket is not loopback. |
| POST | `/api/insight` | Requires non-empty `brief` <= 8,000 characters; sanitize/policy; optional `browserResearchId`; returns generation summary. | `/api` auth; provider calls and optional Browser snapshot read. Errors mapped through `sendGenerationError`. |
| POST | `/api/concept` | Requires `insight`; validates the string or known insight text before sanitize/policy. | `/api` auth; provider call; structured provider/budget errors. |
| POST | `/api/script` | Requires `concept`; validates selected text before sanitize/policy. | `/api` auth; provider call; structured provider/budget errors. |
| POST | `/api/full-pipeline` | Requires non-empty `brief` <= 8,000 chars; sequential Insight → Concept → Script. Optional `browserResearchId`. | `/api` auth; multiple model calls. Not the Agent pipeline; `sendGenerationError` maps failures. |
| GET | `/api/metrics` | Returns request metrics, provider label and Gateway stats. | `/api` auth; metric/Gateway data is process-local. |
| GET | `/api/session` | Returns auth-required/authenticated status; `Cache-Control: no-store`. | Session-specific limiter skips non-POST. |
| POST | `/api/session` | Reads `apiKey`; returns authenticated state or 401; no key echo. | Session limiter (10/15 min); requires configured API key and trusted origin inside `createApiSession`. |
| DELETE | `/api/session` | Destroys cookie session and returns 204. | Requires trusted Origin; `Cache-Control: no-store`. |
| GET | `/api/key-status` | Returns provider configured booleans/models/labels, not key values. | Explicit `/api` auth exemption. |

## Agent routes (`/api/agent`)

All routes below are behind the global `/api` authentication boundary, subject to loopback behavior when `TEXTFX_API_KEY` is unset.

| Method | Path | Observed handler behavior / validation | Extra authorization / outcome |
|---|---|---|---|
| GET | `/status` | Agent mode, counts, recent runs/audit and capability labels. | Read-only. |
| GET | `/runs` | Lists in-memory Agent runs. | Read-only. |
| GET | `/runs/:runId` | Validates run ID then loads run. | 400 invalid ID; 404 absent. |
| GET | `/runs/:runId/candidates` | Validates ID and loads candidate archive. | 400 invalid ID; 404 no archive. |
| GET | `/runs/:runId/events` | Validates ID and reconstructs lifecycle from event log. | 400 invalid ID; 404 no events. JSON endpoint, not SSE. |
| GET | `/runs/:runId/approval` | Validates ID and reports approval plus validation. | 400 invalid ID; 404 absent run. |
| POST | `/runs/:runId/approve` | Validates ID and requires non-empty `approvedBy`; optional `policyVersion`. | `authorizeApproverToken`; then creates content/version/policy/evidence-bound approval. |
| POST | `/runs/:runId/execute-action` | Validates ID and non-empty `action`; optional `policyVersion`. | Requires valid approval; currently returns 501 because no consequential-action executor is configured. |
| DELETE | `/runs/:runId` | Validates ID and deletes run/archive. | 400 invalid ID; 404 when not found. |
| GET | `/audit` | `limit` clamped to 1..50 (default 20). | Read-only. |
| POST | `/run` | Requires `goal` <= 2,000 chars; optional `brief` <= 8,000, `archetype` <= 100, `language` <= 10; sanitize/policy and idempotency-key consistency checks. | `/api` auth; optional Browser token for research; errors translated in route. Invokes Agent Orchestrator. |

## Browser routes (`/api/browser`)

These paths are exempt from global `/api` authentication, but `browser-route.ts` applies `authorizeBrowser` to the entire router, including status/read/delete. Requires opt-in, exact allowed host configuration and a token of at least 32 characters.

| Method | Path | Observed behavior / input checks | Error / data boundary |
|---|---|---|---|
| GET | `/status` | Returns enabled/mode/allowlist/limits metadata. | Requires Browser authorization. |
| POST | `/research` | `parseBrowserRequest` allows only `goal` and 1-3 unique URLs; goal <= 1,000 chars. Read-only research. | 201 on returned research; Browser-specific errors. |
| GET | `/runs/:runId` | Loads and integrity-checks saved research snapshot. | Browser-specific errors. |
| DELETE | `/runs/:runId` | Deletes research snapshot. | 204 on success; Browser-specific errors. |

## SaaS routes (`/api/saas`)

Routes are behind global `/api` auth. State currently reports `billingReady: false`, `authReady: false`, and `in-memory-demo`; this is not production SaaS or multi-tenant readiness.

| Method | Path | Observed behavior / input checks | Boundary |
|---|---|---|---|
| GET | `/status` | Returns scaffold status and sanitized tenant summaries. | Process-local Maps. |
| GET | `/plans` | Returns plan metadata. | Plan limits are metadata; enforcement not established by this route. |
| POST | `/register` | Requires `companyName`; optional `planId`. Mints tenant and API key. | Returns newly created tenant/key in registration response; route casts planId to broad type and state selects starter for unknown plan values. |
| GET | `/usage/:tenantId` | Returns usage and a tenant view with `apiKey` removed. | 404 unknown tenant; process-local usage. |

## Global middleware and shared contract notes

- Middleware order in `index.ts`: CORS → security headers → `express.json({ limit: '512kb' })` → general 120/minute limiter → session POST limiter → `/api` auth boundary → request ID/access log/metrics → handlers/routers → global error handler.
- CORS allows configured origins and methods GET/POST/DELETE/OPTIONS; credentials are enabled.
- `/api` global-auth exemptions in `index.ts`: `/health`, `/healthz`, `/key-status`, `/browser`, and `/browser/*`. `/api/session` has its own internal rules. `apiAuthenticationMiddleware` also exempts `/session`.
- When `TEXTFX_API_KEY` is absent, source `authenticateApi` allows loopback socket requests only. Server startup binds to `127.0.0.1`. Proxy/TLS deployment assumptions have not been runtime-verified here.
- General limiter is 120/minute except `/health` and `/healthz`; `/llm` adds 60/minute; session POST adds 10 per 15 minutes.
- Provider/model selection and budget validation are implemented in `requestBudgetContext`/Gateway; this inventory does not certify every route’s effective provider selection or cost.
- Route-specific and global errors are not yet normalized into one response schema. The inventory intentionally records observed behavior rather than asserting uniformity.

## BE-04 contract work still required

For each registered method/path, specify and test: request schema and bounds; response shape/version; auth principal/exemption; sanitization; rate limit; timeout/cancellation; idempotency; exact status/error codes; provider/budget/storage side effects; unsupported methods and body-parser errors; backward compatibility.

No behavior change is authorized by this inventory.
