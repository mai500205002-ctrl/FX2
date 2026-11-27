# Backend API and Contract Inventory

Status: PRELIMINARY STATIC INVENTORY  
Baseline HEAD: 8e7771ef49d8ea0af94b9594488f9b9fe619ce6d  
Date: 2026-11-27

This inventory is based on route declarations in backend/src/index.ts and mounted route files. It does not replace request/response schema validation or runtime authorization tests.

## Core HTTP routes

| Method | Path | Purpose | Boundary / notes |
|---|---|---|---|
| GET | /health | Liveness | Public health endpoint |
| GET | /healthz | Liveness/readiness probe | Public health endpoint |
| POST | /agent/run | Retired legacy endpoint | Returns 410 and points to /api/agent/run |
| POST | /llm | Raw LLM generation | Strict LLM rate limit; API auth boundary must be verified |
| GET | /api/system-prompt | Current system prompt/version | /api authentication |
| POST | /api/insight | Generate Insight | /api authentication; provider budget context |
| POST | /api/concept | Generate Concept | /api authentication; provider budget context |
| POST | /api/script | Generate Script | /api authentication; provider budget context |
| POST | /api/full-pipeline | Legacy sequential Insight → Concept → Script | /api authentication; not the Agent orchestration |
| GET | /api/metrics | Gateway/runtime metrics | /api authentication |
| GET | /api/key-status | Provider configuration status | Explicitly exempt from /api authentication; must never expose key values |
| GET/POST/DELETE | /api/session | Session status/login/logout | Session-specific limiter and origin/session rules |

## Agent routes mounted at /api/agent

| Method | Path | Purpose |
|---|---|---|
| GET | /api/agent/status | Agent readiness and counts |
| GET | /api/agent/runs | List runs |
| GET | /api/agent/runs/:runId | Fetch run |
| GET | /api/agent/runs/:runId/candidates | Candidate archive |
| GET | /api/agent/runs/:runId/events | JSON lifecycle events |
| GET | /api/agent/runs/:runId/approval | Approval status/validation |
| POST | /api/agent/runs/:runId/approve | Create approval |
| POST | /api/agent/runs/:runId/execute-action | Consequential action gate |
| DELETE | /api/agent/runs/:runId | Delete run |
| GET | /api/agent/audit | Audit events |
| POST | /api/agent/run | Full Agent orchestration |

## Browser routes mounted at /api/browser

| Method | Path | Purpose | Boundary |
|---|---|---|---|
| GET | /api/browser/status | Browser policy/status | Browser-specific policy |
| POST | /api/browser/research | Read-only research | Requires browser token and enabled policy |
| GET | /api/browser/runs/:runId | Load research record | Browser-specific policy |
| DELETE | /api/browser/runs/:runId | Delete research record | Browser-specific policy |

The /api authentication middleware exempts /api/browser paths; browser-route.ts applies its own authorizeBrowser middleware. This exception must remain independently tested.

## SaaS routes mounted at /api/saas

| Method | Path | Purpose |
|---|---|---|
| GET | /api/saas/status | SaaS scaffold status |
| GET | /api/saas/plans | Plan metadata |
| POST | /api/saas/register | Registration scaffold |
| GET | /api/saas/usage/:tenantId | Usage scaffold |

SaaS endpoints exist in source, but the controlling roadmap limits the active project to single-user backend completion. Do not expand SaaS behavior or claim multi-tenant readiness.

## Middleware and security observations

- Express JSON body limit is 512 KB.
- General rate limiter is 120 requests/minute; raw LLM limiter is 60/minute; session POST limiter is 10 attempts per 15 minutes.
- API authentication is applied to /api routes, with explicit health/key-status/session/browser exceptions.
- If TEXTFX_API_KEY is unset, authenticateApi permits loopback requests only; the server binds to 127.0.0.1.
- Session-cookie access is accepted only while TEXTFX_API_KEY is configured and origin checks pass for state-changing requests.
- Browser routes use a separate browser token and allowlist policy.
- Approver operations use a separate approver/admin token or the API key fallback.
- The legacy /agent/run route returns 410; the active Agent endpoint is /api/agent/run.

These are static code observations. BE-05/BE-06 must test missing, invalid, expired and valid credentials, route exemptions, Origin/CORS behavior, approval replay and privilege boundaries.

## Contract inventory still required

For each route, BE-04 must document:
- request schema and maximum sizes;
- response schema/version;
- authentication and authorization rule;
- validation and sanitization;
- rate-limit behavior;
- timeout/cancellation behavior;
- idempotency semantics;
- error status/code contract;
- provider/model/budget side effects;
- compatibility tests.

No API behavior should be changed solely from this inventory.
