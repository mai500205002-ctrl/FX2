# REPORT-INCREMENT21 — Creative Pipeline

**Date:** 2026-10-25  
**Starting source of truth:** `/workspaces/Fxfx/TextFX-Increment20-CoreContracts.zip`  
**Archive SHA-256:** `52e9d24c45a0e205962f885acbc20cc45441c77b3b4949e2bf5000208983f12c`  
**Extracted baseline:** `/workspaces/Fxfx-increment20-baseline/TextFX-Creative-Core-Increment19/` (kept separate and unchanged)  
**Runtime:** Node `v24.21.0`, npm `11.19.0`; backend TypeScript `5.9.3`, app Vite `5.4.21`.

## Scope and baseline

The archive's outer report identifies Increment20, while its source directory retains the name `TextFX-Creative-Core-Increment19`. The archive report documents that naming discrepancy. The archive itself was preserved; source was extracted to a separate directory.

- Archived baseline: `npm test` in `backend/` — exit 0, **81/81**, no skips.
- Archived frontend: `npm run typecheck && npm run build` in `app/` — exit 0.
- Current working copy before Increment21: backend `122/122`, app typecheck/build exit 0. This working copy already contained the reported Increment22 browser hardening and Gemini-only Increment23 gateway changes; no separate Increment21/23/24 reports or raw logs were present.
- Baseline logs: `backend-baseline.log` and `frontend-baseline.log` beside the isolated extracted baseline. Current pre-change logs are `current-backend-baseline.log` and `current-frontend-baseline.log`.

## Implemented

- Reused the five existing lateral-thinking technique outputs as independent discovery inputs: Provocation, Analogy, Random Stimulus, Opposite Thinking, and Constraint Reversal. Discovery runs sequentially to keep concurrency bounded.
- Each candidate now carries a stable candidate ID, technique ID, version, run ID, and prompt version. The strategy is recorded as `five-technique-v1`; the complete pipeline records `five-technique-metabolism-entropy-v2`.
- A failed lens is recorded while successful candidates are retained. Failures are visible in the audit trace and persisted in CreativeIR.
- Added a local versioned candidate archive with immutable generated/decision entries, atomic replacement, mode `0600`, stable event IDs, duplicate-event idempotency, reload support, and `TEXTFX_CANDIDATE_ARCHIVE_PATH`. By default it shares the directory of `TEXTFX_CREATIVE_MEMORY_PATH`, or uses `data/creative-candidates.json`.
- Added `GET /api/agent/runs/:runId/candidates` to retrieve archived history without changing existing routes or response fields.
- Reviewer objections now include candidate ID/version, rubric version, criterion, defect, rationale, suggested fix, verification test, and source attribution. A non-ready model review without valid objections fails validation. Legacy injected reviewers are explicitly labeled `legacy-derived`; fallback objections remain `structural-fallback`.
- The existing single targeted revision remains the limit. The run and CreativeIR retain each script version, review, and decision; candidate-version changes increment independently from script artifact versions.
- Added deterministic token-Jaccard candidate diversity and exact/near-duplicate diagnostics to the existing benchmark CLI. These are clearly labeled lexical diagnostics, not semantic originality or audience evidence. Candidate diagnostics can run without human ratings and remain separate from blind-human scores.
- Extended regression manifest and CreativeIR validation for candidate identity, provenance, selected candidate, failed lenses, and revision history. Legacy candidate records without the new optional provenance fields remain accepted.

## Verification

| Command | Exit | Result |
|---|---:|---|
| `cd backend && npm test` | 0 | **131 tests passed, 0 failed, 0 skipped** |
| `cd app && npm run typecheck && npm run build` | 0 | Typecheck passed; Vite production build passed |
| Focused discovery/archive/reviewer/benchmark tests | 0 | All focused checks passed; latest combined check `22/22` |
| `git diff --check` | 0 | Clean |

Raw Increment21 output: `increment21-backend.log`, `increment21-frontend.log`.

The candidate-only CLI integration test uses explicitly synthetic fixture data and asserts the report does not label it as human evaluation. **NOT RUN:** live Gemini generation and blind human scoring; no provider credential or completed reviewer ratings were supplied. No creative-quality improvement is claimed. Windows packaging was not attempted in this Linux environment.

## Changed-file inventory

Added: `backend/src/modules/candidate-archive.ts`, `backend/tests/candidate-archive.test.cjs`, `backend/tests/discovery-lenses.test.cjs`, `REPORT-INCREMENT21.md`, `increment21-backend.log`, `increment21-frontend.log`.

Changed: `backend/src/agent/agent-route.ts`, `backend/src/agent/agent-service.ts`, `backend/src/agent/types.ts`, `backend/src/core/creative-ir.ts`, `backend/src/modules/creative-entropy.ts`, `backend/src/modules/creative-quality-lab.ts`, `backend/src/modules/creative-reviewer.ts`, `backend/src/modules/discovery-engine.ts`, `backend/src/modules/idea-metabolism.ts`, `backend/src/modules/lateral-thinking-agent.ts`, `backend/scripts/score-creative-benchmark.cjs`, `backend/tests/agent-pipeline.test.cjs`, `backend/tests/core-contracts.test.cjs`, `backend/tests/creative-quality-lab.test.cjs`, `backend/tests/fixtures/creative-regression-cases.json`.

No files were removed. The Increment20 archive and extracted baseline remain recoverable and unchanged.

## Acceptance and limitations

Five independently attributable discovery lenses, candidate provenance/history, structured review objections, bounded revision history, backward-compatible CreativeIR/API additions, and deterministic lexical diversity metrics are implemented and covered by tests. Automated acceptance criteria are met for this environment. Live-provider quality, blind human ratings, cross-process archive concurrency, and Windows packaging remain unverified. The candidate archive is local single-process storage; it is not a transactional multi-process store.
