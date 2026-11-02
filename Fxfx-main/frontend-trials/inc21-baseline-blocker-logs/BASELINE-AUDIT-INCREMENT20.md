# BASELINE AUDIT — Increment20 (before Increment21)

Date: 2026-10-25. Status: **baseline NOT RUN (blocked)**. No source file was modified.

## 1. Blocker (exact, with evidence)

The sandbox cannot reach any package registry, so dependencies cannot be installed and nothing can be built or tested.

| Check | Result |
|---|---|
| `npm ci --ignore-scripts` (x2, clean `node_modules` each time) | exit 1, `npm error Exit handler never called!` |
| npm debug log | `http fetch GET https://registry.npmjs.org/<pkg>.tgz attempt 3 failed with ENOTFOUND` (hundreds of packages) |
| `getent hosts registry.npmjs.org` | no resolution |
| `curl https://registry.npmjs.org/ws` (direct and via agent proxy) | `Could not resolve host`, HTTP 000 |
| `pip download ws` | `No matching distribution found` (PyPI unreachable too) |
| Resulting `node_modules` | 532 empty folders; `express`, `cors`, `dotenv`, `express-rate-limit`, `@google/genai`, `typescript`, `@types/node`, `vite`, `react` all **missing** |

Consequences, all marked **NOT RUN**: backend `tsc` build, frontend typecheck, `vite build`, `node --test` (tests import `../dist/**`, which needs a build), live endpoint tests, real-Chromium browser test.

I did not substitute mocks, stubs, or hand-transpiled partial runs, because the plan forbids presenting those as the baseline.

**Reported (not re-verified by me):** the archive's own logs state install exit 0, build exit 0, 71/71 tests at Increment19.1 and 81/81 at Increment20 (`inc20logs/baseline-*.log`, `final-build-tests.log`). Treat as unverified until re-run.

**Smallest decision needed from you:** one of
1. run the session where `registry.npmjs.org` is reachable and tell me to retry, or
2. attach the installed `node_modules` (or a `npm pack`/offline cache) for `backend/` and the root workspace.

## 2. Implementation map (read from source, not from README)

Layout: npm workspaces `app` (React/Vite), `backend` (Express/TS), `electron-src`. About 4,360 lines of backend TS, 11 test files.

| Capability | Status | Evidence |
|---|---|---|
| CreativeIR contract + versioning | Implemented | `core/creative-ir.ts`, `core-contracts.test.cjs` |
| Discovery Engine | **Partial vs plan 21.1** | only **3** lenses (`human-truth`, `system-reversal`, `unexpected-analogy`), not the five TextFX techniques; lenses are run via `mapConcept`, not via the original technique prompts |
| Five TextFX techniques | Exist, **not wired to discovery** | `generateProvocation/Analogies/RandomStimulus/OppositeThinking/ConstraintReversal` in `lateral-thinking-agent.ts` |
| Candidate ranking | Heuristic | keyword overlap + distinctiveness + field completeness; no model judgment |
| Creative Court, Reviewer | Implemented, versioned `1.0.0` | rubric weights 25/20/20/15/10/10; 6-criterion script review |
| Creative Memory | Implemented, **durable** | JSON file `data/creative-memory.json`, atomic temp-file + rename, mode 0600 |
| Run store (`runStore`) | **In-memory only** | `Map` in `agent-service.ts`; lost on restart (relevant to Increment24) |
| Browser evidence | Durable, hashed | `sha256` envelope written with `flag: 'wx'` |
| Browser Agent security | Implemented (19.1) | policy/SSRF/tamper tests exist; Chromium path not re-run here |
| Gateway | Single Gemini provider | no budget reservation; cache counters hard-coded 0 (from the earlier `fxnew` snapshot, re-check in 23) |
| Auth | Open routes | 24 routes; tenant id still taken from header/body; browser auth only when `browserResearchId` present |
| Discovery concurrency | `Promise.all` over lenses | no budget cap; a single lens failure is tolerated, all-fail throws (good: no fabricated output) |

## 3. Ready-to-run Increment21 plan (starts the moment baseline can run)

1. Re-run baseline, save logs (expect 81/81).
2. 21.1: extend `LENSES` from 3 to the 5 original techniques, reusing the existing technique functions and prompts verbatim; add `lensId`, `promptVersion`, `runId` to each candidate; keep per-lens failure isolation; bound concurrency.
3. 21.2: persist the candidate archive next to creative-memory (same atomic-write pattern); stable ids, no overwrite, lineage `parentIds`.
4. 21.3/21.4: structured objections with criterion, rubric version, fix, and fix-test; max 2 revisions (reviewer already bounds revisions; add tests).
5. 21.5: reuse memory/metabolism/entropy; benchmark of duplication and diversity on the fixed fixtures, fixtures only, labeled as such.
6. Deliver `REPORT-INCREMENT21.md`, raw logs, changed-file list, archive.

## 4. Not done / limits

- No code changed, no archive produced for Increment21.
- Nothing above about runtime behavior is verified by execution in this session.
