# REPORT-INCREMENT25 — Security, Privacy, and Governance

**Date:** 2026-10-26  
**Baseline:** Increment 24 (147 passing tests)  
**Final:** Increment 25 (157 passing tests, 0 failing, 0 skipped)  

## Summary of Completed Work

### 25.1 Authentication and Authorization at Backend Boundaries
- Centralized server-side API key authentication (`TEXTFX_API_KEY`) for all `/api/*` endpoints (with exemptions for public health checks `/health`, `/healthz`, `/api/key-status`).
- Enforced strict approver token authorization (`TEXTFX_APPROVER_TOKEN` or `TEXTFX_ADMIN_TOKEN`) on artifact approval endpoints (`POST /api/agent/runs/:runId/approve`).
- Maintained browser token authentication (`TEXTFX_BROWSER_TOKEN` >= 32 characters) on `/api/browser/*`.

### 25.2 Input Sanitization and Payload Limits
- Enforced 512KB payload limit across all JSON request bodies.
- Bound incoming creative fields: `goal` (1-2000 characters), `brief` (max 8000 characters), `archetype` (max 100 characters), and `language` (max 10 characters).
- Applied prompt injection detection (`sanitize()`) and harmful content filtering (`policyCheck()`) across all generation endpoints (`/llm`, `/api/insight`, `/api/concept`, `/api/script`, `/api/full-pipeline`, and `/api/agent/run`).

### 25.3 Secret Hygiene and Log Redaction
- Integrated `redactText()` across server loggers, error handling middleware, and trace records.
- Automatically strips credentials, bearer tokens, API keys, and passwords from logs and HTTP error responses.
- Prohibited model inputs and raw secrets from appearing in public audit or metric feeds.

### 25.4 Path Traversal Defense and Path Validation
- Hardened all `runId` path parameter routes (`/runs/:runId*`) using strict alphanumeric regex `/^[a-zA-Z0-9_-]{1,64}$/`.
- Blocked path traversal primitives (`..`, `/`, `\`, null bytes) across all file storage boundaries (`agent-run-store`, `candidate-archive`, and `browser-service`).

### 25.5 Data Retention and Deletion Controls
- Implemented `deleteAgentRun()` and exposed `DELETE /api/agent/runs/:runId` returning `204 No Content`.
- Deletion purges disk snapshots from `runs/<runId>.json` and cascades deletion of candidate decisions from `creative-candidates.json`.
- Added `pruneExpiredAgentRuns(retentionDays)` for automated maintenance of legacy run snapshots.

### 25.6 Untrusted Web Content Isolation
- Verified that untrusted web excerpts fetched by the Browser Agent enter only user-level data prompts with explicit disclaimers, never system instruction blocks.
- Verified that model output claiming approval or escalated roles cannot alter server-side authorization.

### 25.7 Human Approval Gate for Consequential Actions
- Added `POST /api/agent/runs/:runId/execute-action` which explicitly requires a valid, verified `ArtifactApproval`.
- Blocks unapproved or invalidated runs with `403 Forbidden`.
- Any modification to artifact, policy, or evidence invalidates approval and immediately re-blocks consequential execution.

### 25.8 HTTP Security Headers and CORS
- Enforced strict security headers on all responses:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 0` (modern standard relying on CSP)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy: default-src 'none'`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- Restricted CORS methods (`GET, POST, DELETE, OPTIONS`) and explicit allowed headers.
- Rate limiting enforced: general 120 req/min, LLM 60 req/min, agent runs 30 req/min.

## Verification

| Command | Exit Code | Result |
|---|---:|---|
| Baseline `npm test` in `backend/` | 0 | 147/147 passed |
| Final `npm test` in `backend/` | 0 | **157/157 passed**, 0 failed, 0 skipped |
| `npm run build` in `app/` | 0 | Production frontend build succeeded |
| `npm audit --omit=dev` in `backend/` | 0 | **0 vulnerabilities found** |
| `npm audit --omit=dev` in `app/` | 0 | **0 vulnerabilities found** |

Raw logs: `increment25-backend.log`, `increment25-frontend.log`, `increment25-audit.log`.

## Changed-File Inventory

- Changed:
  - `backend/src/index.ts`
  - `backend/src/agent/agent-route.ts`
  - `backend/src/agent/agent-service.ts`
  - `backend/src/agent/agent-run-store.ts`
  - `backend/src/modules/candidate-archive.ts`
- Added:
  - `backend/src/utils/security.ts`
  - `backend/tests/security-governance.test.cjs`
  - `REPORT-INCREMENT25.md`
  - `increment25-backend.log`
  - `increment25-frontend.log`
  - `increment25-audit.log`

## Threat Model and Remaining Risks

1. **Deployment Model:** Single-process or containerized backend. Multi-process clustering requires distributed transactional locking for run-level budget reconciliation.
2. **Model Safety:** While input injection and prompt boundaries are strictly enforced server-side, real model completions can still produce subjective variations; consequential actions therefore require human review and approval.
3. **Browser Sandbox:** Playwright Chromium uses default OS-level sandboxing; root execution without sandboxing remains explicitly prohibited.

Increment 25 acceptance criteria are fully met.
