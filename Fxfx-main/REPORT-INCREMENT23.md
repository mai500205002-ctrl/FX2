# REPORT-INCREMENT23 — Gemini Gateway and Budget Control

**Date:** 2026-10-25  
**Source chain:** Increment20 archive SHA-256 `52e9d24c45a0e205962f885acbc20cc45441c77b3b4949e2bf5000208983f12c`; Increment21 checkpoint separately verified.  
**Provider scope:** Gemini-only; no OpenAI or Vertex adapter was present or added.

## Baseline

- Before Increment23, the current copy (Increment21 plus Increment22 hardening) passed backend `131/131`, with zero skipped tests.
- Frontend typecheck and production build passed.
- Source inspection found the only provider SDK call (`models.generateContent`) in `backend/src/gateway/llm-gateway.ts`; remaining model callsites use the gateway-compatible provider interface.

## Implemented

- Added versioned task routing `gemini-task-routing-v1` for `candidate-generation`, `critique`, `final-artifact`, and `utility`. Each task may use a dedicated `GEMINI_MODEL_*` environment variable; unset values inherit `GEMINI_MODEL`, then `gemini-3.1-flash-lite`.
- Added run-level and call-level budget reservations at the gateway boundary. The maximum retry envelope is reserved synchronously before provider access, so concurrent calls cannot reserve beyond the process-local run cap.
- Reconciled successful calls using reported/estimated usage. A successful retry charges final-call usage plus conservative reservations for failed attempts; a call with uncertain usage charges its entire reservation. Cache hits do not create a provider reservation, and cache/dedup keys are scoped to a run.
- Added stable per-call request IDs, idempotency checks, bounded 1,000 calls/run, bounded 1,000 tracked runs with idle-only eviction after 24 hours, and a 500-entry prompt-free call-provenance history.
- Attached model/provider/task/request/run/prompt-version/usage/cost provenance to AgentRun and CreativeIR outputs. Prompts and API keys are not stored in call history.
- Exposed aggregate routing and budget information through existing `/api/metrics`; no run IDs are exposed by the public aggregate budget response. API budget denials return `429 BUDGET_EXCEEDED`.
- Propagated budget/task contexts through the agent, `/llm`, `/api/insight`, `/api/concept`, `/api/script`, and `/api/full-pipeline` routes. The Gemini SDK call remains centralized in the gateway.
- Extended the existing frontend telemetry panel with estimated charged/reserved totals and routing-policy version.
- Added `.env.example` settings and corrected the provider guide to label old Mock/OpenAI/Vertex instructions as historical proposals, not implemented behavior.

## Verification

| Command | Exit | Result |
|---|---:|---|
| Baseline `npm test` | 0 | 131/131 before Increment23 |
| Final `npm test` in `backend/` | 0 | **139/139**, 0 failed, 0 skipped |
| `npm run typecheck && npm run build` in `app/` | 0 | Both passed |
| `npm audit --omit=dev --audit-level=high` | 0 | 0 runtime vulnerabilities |
| `git diff --check` | 0 | Clean |
| Direct provider-call search | 0 | Only `llm-gateway.ts` calls `models.generateContent` |

Raw logs: `increment23-backend.log`, `increment23-frontend.log`, `increment23-runtime-audit.log`.

Tests cover five concurrent/settlement cases including run-budget denial before provider access, call-budget denial, retries with uncertain usage, actual usage reconciliation after retry, invalid token configuration, run-scoped cache isolation, all four configured model routes, prompt-free provenance, and an HTTP `/api/agent/run` budget rejection returning 429 without a Gemini SDK call.

**NOT RUN:** real Gemini API calls; no `GEMINI_API_KEY` was supplied. Gemini credentials, service availability, and live provider pricing are not represented by SDK fixtures. Windows packaging was not run on this Linux environment.

## Changed-file inventory

Changed: `backend/src/gateway/llm-gateway.ts`, `backend/src/agent/agent-service.ts`, `backend/src/agent/agent-route.ts`, `backend/src/agent/types.ts`, `backend/src/core/creative-ir.ts`, `backend/src/index.ts`, `backend/src/modules/concept-mapper.ts`, `backend/src/modules/creative-court.ts`, `backend/src/modules/creative-reviewer.ts`, `backend/src/modules/insight-generator.ts`, `backend/src/modules/lateral-thinking-agent.ts`, `backend/src/modules/script-writer.ts`, `backend/src/modules/visual-prompt-generator.ts`, `backend/tests/gemini-gateway.test.cjs`, `backend/tests/gateway-budget.test.cjs`, `backend/.env.example`, `docs/AI_PROVIDERS_SETUP.md`, `app/src/components/GatewayMetricsPanel.tsx`.

Added: `REPORT-INCREMENT23.md`, `increment23-backend.log`, `increment23-frontend.log`, `increment23-runtime-audit.log`. No files removed.

## Limitations and acceptance

Budget state and call provenance are **process-local**, not atomic across multiple backend processes. Multi-process deployments must use one backend process or adopt a shared transactional reservation store before claiming global budget enforcement. Costs use provider usage where present and local estimates otherwise; failed calls with uncertain usage are charged the reservation. No live provider result or creative-quality improvement is claimed.

Automated gateway, routing, provenance, compatibility, frontend, and dependency checks passed. Increment23's testable acceptance criteria are met for the current single-process deployment model; cross-process atomic budgets and real Gemini integration remain unverified.
