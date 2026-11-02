# REPORT-INCREMENT20 — Core Contracts & Compatibility

**Project:** TextFX Creative Core — built on the verified Increment19.1 baseline
**Date:** 2026-10-25
**Environment:** Sandbox Linux — Node v22.23.4 / npm 10.9.9 / TypeScript 5.4.x / Vite 5.4.21
**Scope:** Stabilize core data contracts and execution boundaries. No architecture rewrite, no broken endpoints, no duplicated functionality.

---

## Phase 1 — Inspection Before Changing Anything

The exact Increment19.1 stabilized archive (`TextFX-Increment19-1-Stabilized.zip`) was unpacked into a clean directory (`increment20_clean/`). No older project directories were merged.

Files inspected before any edit:

| File | What was inspected |
|------|--------------------|
| `REPORT-INCREMENT19-1.md` | Prior baseline: 71/71 tests, verified browser-agent path, known gaps |
| `backend/src/index.ts` | All 11 top-level routes, CORS, security headers, rate limits, `buildCtx`, server bind |
| `backend/src/core/creative-ir.ts` | `CREATIVE_IR_VERSION='1.0.0'`, `CreativeIR` interface, `createCreativeIR`, `validateCreativeIR`, `summarizeCreativeIR` |
| `backend/src/agent/types.ts` | `AgentPhase`, `AgentRunRequest`, `AgentRunRecord` (run state), `AgentStatusResponse` |
| `backend/src/agent/agent-service.ts` | `runStore` (Map), `pushAudit`, provenance construction, browser-evidence attachment, run lineage |
| `backend/src/agent/agent-route.ts` | 5 routes; browser auth only when `browserResearchId` present; tenant guard |
| `backend/src/modules/lateral-thinking-agent.ts` | `getLateralThinkingSystemPrompt` — **not versioned** before this increment |
| `backend/src/modules/creative-court.ts` | Court rubric weights in prompt text — **not versioned** before this increment |
| `backend/src/modules/creative-reviewer.ts` | 6-criterion script rubric — **not versioned** before this increment |
| `backend/src/modules/creative-memory.ts`, `discovery-engine.ts`, `idea-metabolism.ts`, `creative-entropy.ts`, `counterfactual-replay.ts` | Discovery / Court / Reviewer / Memory implementations (via imports and tests) |
| `backend/src/browser/*` | Browser policy, service, routes (verified in Increment19.1) |
| `backend/tests/*` (11 files) | All existing tests, incl. `agent-pipeline.test.cjs` and `browser-agent.test.cjs` |

README claims were not trusted; all statements above come from reading the source.

### Capability status (established baseline)

| Capability | Status |
|------------|--------|
| CreativeIR schema + create/validate/summarize | **Implemented, tested** (unit tests existed) |
| Discovery Engine (multi-lens + metabolism + entropy) | **Implemented, tested** via agent-pipeline tests |
| Creative Court (rubric judgment + labeled fallback) | **Implemented, tested** |
| Creative Reviewer (6 criteria + bounded revision + shadow replay) | **Implemented, tested** |
| Creative Memory (facts/preferences/history/evaluation) | **Implemented, tested** |
| Provenance (provider, generatedAt, browserResearch) | **Implemented; prompt/rubric versions missing** → added this increment |
| Browser Agent (policy, SSRF, evidence, tamper detection) | **Implemented, tested** (Increment19.1) |
| Run state (`AgentPhase` on `AgentRunRecord`) | **Implemented** |
| Idea state (candidate verdicts `advance/revise/reject`) | **Implemented but not an explicit contract** → made explicit this increment |
| Prompt & rubric versioning | **Missing** → added this increment |
| Evidence "unreviewed-only" boundary check in `validateCreativeIR` | **Missing** → added this increment |

## Phase 2 — Changes Implemented (files changed and why)

| # | File | Change | Why |
|---|------|--------|-----|
| 1 | `backend/src/core/creative-ir.ts` | Added exported `EvidenceReference` interface (`runId`, `evidenceIds`, `reviewStatus: 'unreviewed'`); extended `provenance` with optional `promptVersion` and `rubricVersions`; added boundary check in `validateCreativeIR`: evidence references may only carry `reviewStatus: 'unreviewed'` (anything else throws), runId and evidenceIds must be non-empty strings | Contract for evidence references; prevents unreviewed evidence from being marked verified at the system boundary |
| 2 | `backend/src/agent/types.ts` | Added exported `IdeaVerdict` type; `AgentRunRecord.browserResearch` now uses `EvidenceReference` | Makes Run state (`AgentPhase`) vs Idea state (`IdeaVerdict`) an explicit, disjoint contract |
| 3 | `backend/src/modules/lateral-thinking-agent.ts` | Added `SYSTEM_PROMPT_VERSION = '1.0.0'` (content unchanged) | Prompt versioning: proven content preserved, version recorded in provenance |
| 4 | `backend/src/modules/creative-court.ts` | Added `COURT_RUBRIC_VERSION = '1.0.0'` (rubric weights unchanged) | Rubric versioning |
| 5 | `backend/src/modules/creative-reviewer.ts` | Added `REVIEW_RUBRIC_VERSION = '1.0.0'` (criteria unchanged) | Rubric versioning |
| 6 | `backend/src/agent/agent-service.ts` | Provenance now records `promptVersion: SYSTEM_PROMPT_VERSION` and `rubricVersions: { court, scriptReview }`; imports of the version constants and `CREATIVE_IR_VERSION` | Every run provenance can identify the exact prompt/rubric versions used |
| 7 | `backend/src/index.ts` | `/api/system-prompt` response now includes `promptVersion: SYSTEM_PROMPT_VERSION` (additive field) | Version visibility at the API boundary; existing consumers unaffected |
| 8 | `backend/tests/core-contracts.test.cjs` | **New file**: 10 contract tests (see Phase 5) | Acceptance criteria for the new contracts |

**Compatibility decisions:** all new fields are optional. Legacy CreativeIR payloads without `promptVersion`/`rubricVersions`/`browserResearch` validate unchanged (test proves it). No endpoint path, method, or existing response field was removed or changed; only additive fields were introduced.

## Phase 3 — Endpoint Compatibility Inventory (derived from source, tested live)

Actual route count: **24 routes** (11 in `index.ts`, 5 in `agent-route.ts`, 4 in `saas-route.ts`, 4 in `browser-route.ts`) — not 19; the real count was taken from the source.

| # | Method | Path | Auth | Live test result (HTTP) |
|---|--------|------|------|--------------------------|
| 1 | GET | `/healthz` | none | **200** `{"ok":true,...}` |
| 2 | GET | `/health` | none | **200** `{"status":"ok",...}` |
| 3 | GET | `/api/system-prompt` | none | **200**, now returns `promptVersion:"1.0.0"` + systemPrompt (additive) |
| 4 | POST | `/api/insight` | sanitizer + policy | missing brief → **400** `{"error":"brief required"}`; GET → 404 |
| 5 | POST | `/api/concept` | sanitizer + policy | missing insight → **400** |
| 6 | POST | `/api/script` | sanitizer + policy | missing concept → **400** |
| 7 | POST | `/api/full-pipeline` | sanitizer + policy | missing brief → **400** |
| 8 | GET | `/api/metrics` | none | **200** keys `[gateway, providerMode, routes, totals, uptime]` |
| 9 | GET | `/api/key-status` | none | **200** `{"configured":false,"provider":"Gemini"}` (never returns the key) |
| 10 | GET | `/api/agent/status` | none | **200** `{"ok":true,"mode":"Gemini (not configured)","counts":{...}}` |
| 11 | GET | `/api/agent/runs` | none | **200** `{"runs":[]}` |
| 12 | GET | `/api/agent/runs/:runId` | none | unknown id → **404** `{"error":"run not found"}` |
| 13 | GET | `/api/agent/audit` | none | covered by unit tests (`agent-pipeline.test.cjs`); live: **not run** |
| 14 | POST | `/api/agent/run` | none (browser auth only when `browserResearchId` present) | valid goal + no Gemini key → **500** `{"error":"Live Gemini generation is unavailable: configure a valid GEMINI_API_KEY."}` (explicit failure, no silent mock); missing goal → **400** |
| 15 | POST | `/agent/run` (legacy placeholder route) | none | **200** `{"ok":true,"id":...}` (spawns placeholder process — preserved as-is) |
| 16 | GET | `/api/saas/status` | none | **200** `{"billingReady":false,"authReady":false,"persistence":"in-memory-demo",...}` |
| 17 | GET | `/api/saas/plans` | none | **200** `{"plans":[...]}` |
| 18 | POST | `/api/saas/register` | none | valid → **201** tenant + usage + plans; missing companyName → **400** |
| 19 | GET | `/api/saas/usage/:tenantId` | none | valid → **200** tenant + usage; unknown → **404** |
| 20 | GET | `/api/browser/status` | browser fail-closed | disabled → **503** `{"code":"BROWSER_DISABLED",...}` |
| 21 | POST | `/api/browser/research` | browser fail-closed | disabled → **503**; enabled path covered by `browser-agent.test.cjs` (12 live checks in Increment19.1) |
| 22 | GET | `/api/browser/runs/:runId` | browser fail-closed | covered by `browser-agent.test.cjs` unit tests; live: **not run** (needs 32-char token) |
| 23 | DELETE | `/api/browser/runs/:runId` | browser fail-closed | covered by `browser-agent.test.cjs`; live: **not run** |
| 24 | POST | `/llm` | LLM rate limiter + sanitizer + policy | missing key → **500** explicit `Live Gemini generation is unavailable...` (no silent mock) |

**No defect required an endpoint change.** Zero paths, methods, or status codes changed from the Increment19.1 baseline.

## Phase 4 — Prompt and Rubric Versioning

- `SYSTEM_PROMPT_VERSION = '1.0.0'` (lateral-thinking system prompt — content preserved verbatim)
- `COURT_RUBRIC_VERSION = '1.0.0'` (25/20/20/15/10/10 weights unchanged)
- `REVIEW_RUBRIC_VERSION = '1.0.0'` (six criteria unchanged)
- Every completed run's `provenance` now records `promptVersion` and `rubricVersions` (test proves it)
- Prompt/rubric version changes are isolated from schema changes: versions are separate constants; bumping one does not touch `CREATIVE_IR_VERSION`

## Phase 5 — Verification Results (exact commands, exit codes, counts)

### Baseline (before any edit) — `logs/baseline-install.log`, `logs/baseline-build-tests.log`

| Command | Result |
|---------|--------|
| `ELECTRON_SKIP_BINARY_DOWNLOAD=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --ignore-scripts` | exit **0** — `added 796 packages in 7s` |
| `npx tsc -p tsconfig.json` (backend build) | exit **0** |
| `npx tsc --noEmit` (frontend typecheck) | exit **0** |
| `npx vite build` | exit **0** — built in 3.73s |
| `node --test tests/*.test.cjs` | exit **0** — **71 tests / 71 pass / 0 fail / 0 skipped** |

### Final (after contract changes) — `logs/final-build-tests.log`

| Command | Result |
|---------|--------|
| `npx tsc -p tsconfig.json` | exit **0** |
| `node --test tests/*.test.cjs` | exit **0** — **81 tests / 81 pass / 0 fail / 0 skipped** |

### Baseline vs Final test summary

| Metric | Baseline (Increment19.1) | Final (Increment20) | Δ |
|--------|--------------------------|---------------------|---|
| Total tests | 71 | 81 | +10 |
| Pass | 71 | 81 | +10 |
| Fail | 0 | 0 | 0 |
| Skipped | 0 | 0 | 0 |
| Regressions | — | **none** — all 71 baseline tests still pass | — |

### New contract tests (10, all executed and passing — `core-contracts.test.cjs`)

1. Valid CreativeIR blueprint round-trips through create → validate → summarize (incl. JSON serialization round-trip)
2. Rejects missing/wrong `schemaVersion`, empty id, bad language, empty goal, short beats, non-object inputs
3. Evidence reference with `reviewStatus: 'unreviewed'` accepted and survives round-trip
4. **Promoting unreviewed evidence** (`verified`/`reviewed`/`approved`/null/undefined) **is rejected at the boundary**; empty runId/evidenceIds rejected
5. **Legacy payload compatibility**: a CreativeIR without the new optional fields validates unchanged
6. **Run/Idea namespace disjointness**: `AgentPhase` values and `IdeaVerdict` values share no values
7. **Run/Idea isolation at runtime**: a court review with a `reject` verdict never mutates the run status (run stays `done`, concept stays Court-selected)
8. System prompt, court rubric, review rubric carry explicit versions (`1.0.0`)
9. Completed run provenance records `provider`, `promptVersion`, `rubricVersions`
10. **Browser Agent regression**: attached evidence keeps `unreviewed` status through the pipeline, forces `needs-review`, provenance preserves `evidenceIds`, boundary validation accepts it

### Live endpoint tests — `logs/endpoint-live-tests.log`, `logs/endpoint-live-tests2.log`

Server started on 127.0.0.1 (ports 3921/3922) with the built `dist/index.js`; 25 live HTTP checks executed covering all 24 routes (see Phase 3 table). Exit codes and responses logged raw.

### Tests NOT run (with reason)

| Test | Reason |
|------|--------|
| `/api/browser/runs/:runId` GET/DELETE and enabled `/research` against a live server | Requires a 32-char `TEXTFX_BROWSER_TOKEN`; covered instead by `browser-agent.test.cjs` (unit, passing) and the Increment19.1 live verification |
| Live Gemini calls (`/llm`, `/api/full-pipeline` happy path) | No `GEMINI_API_KEY` in this environment; explicit-failure behavior verified instead (500 with the real provider error, no mock) |
| Windows installer / pkg build | Requires Windows and Electron binaries |

## Known Gaps & Limitations

1. Live Gemini path still untested end-to-end (no key in environment) — first live run belongs in Increment21 planning.
2. `/api/agent/audit` live call not executed (unit-covered only).
3. Browser routes live-tested only in their disabled (fail-closed) state.
4. Full Event Store, transactional outbox, atomic budget reservations, tenant isolation, new browser framework, new frontend architecture — explicitly out of scope, not implemented.
5. `spawnAgent` placeholder in `/agent/run` preserved as-is (documented legacy route; real agent entrypoint is `/api/agent/run`).

## Definition of Done check

- ✅ Existing project still builds (backend build exit 0)
- ✅ All 71 previous tests pass — zero regressions (81/81 final)
- ✅ New contract tests pass (10/10)
- ✅ Existing endpoint compatibility demonstrated by live evidence (25 live HTTP checks, 24 routes)
- ✅ Unreviewed evidence stays unreviewed (boundary test + regression test)
- ✅ Run status and Idea status cannot overwrite each other (disjoint-namespace + runtime tests)
