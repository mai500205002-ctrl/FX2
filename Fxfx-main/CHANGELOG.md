# CHANGELOG — TextFX v5 Windows Installer

## [5.0.0] — 2025-03-15  Branch: fx/package-exe

### Added

#### Backend (`backend/src/index.ts`)
- **CLI args** `--port`, `--cert`, `--key` parsed from `process.argv`
- **Bind to 127.0.0.1 only** — removed all `0.0.0.0` bindings
- **HTTPS** via `https.createServer` when `--cert` / `--key` provided; falls back to HTTP for local dev without certs
- **`GET /healthz`** → `{ ok: true, ts }` — used by Electron to poll readiness
- **`POST /agent/run`** → spawns child process with 120 s timeout, returns `{ ok: true, id }`; auto-kills on timeout; full registry cleanup on shutdown
- **`POST /llm`** → sanitizer → policy check → `keytar.getPassword('fx-openai','default')` → OpenAI call; returns 401 if key missing; never logs raw input
- **`POST /api/set-key`** + **`DELETE /api/set-key`** + **`GET /api/key-status`** — keytar write/delete/check endpoints for the UI
- **Rate limiting** — `express-rate-limit` 60 req/min on `/llm`
- **PII-redacted structured logging** — all `prompt`/`input`/`content`/`key` fields replaced with `[REDACTED:<sha256>]`; logs written to `%APPDATA%\fx-logs\fx-server.log`
- **Graceful shutdown** — SIGTERM/SIGINT/uncaughtException kill all child agents, close server, exit 0
- **`keytar`** added as a runtime dependency (`^7.9.0`)
- **`express-rate-limit`** added (`^7.3.1`)

#### Electron (`electron-src/main.ts`)
- Self-signed cert generation via `openssl` CLI on first run; stored in `%APPDATA%\fx-certs\`
- SHA-256 fingerprint computed from the cert PEM and transferred to renderer via `ipcMain.handle('fx:get-backend-info')`
- Dynamic port selection in range 30000–31000 via `net.createServer` probe
- Backend spawned as `windowsHide: true` child process with `execFile`
- `/healthz` polling with basic TLS fingerprint check (cert pinning)
- Content Security Policy injected via `session.defaultSession.webRequest.onHeadersReceived`
- `tree-kill` used in `before-quit` to eliminate orphan process trees on Windows
- `uncaughtException` handler kills backend and calls `app.quit()`

#### Electron (`electron-src/preload.ts`)
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- `window.fx.getBackendInfo()` — returns `{ port, certFingerprint, protocol, host }`
- `window.fx.request(channel, payload)` — whitelist-only IPC router

#### Frontend (`app/src/ApiKeySetup.tsx`) — NEW FILE
- Modal component shown on first run or when `/llm` returns 401
- Validates `sk-` prefix before sending
- Posts to `POST /api/set-key` on local backend (key never stored in renderer)
- Clears input field from memory immediately after successful save
- Accessible (`role="dialog"`, `aria-modal`, `aria-labelledby`)

#### Frontend (`app/src/App.tsx`)
- Added `window.fx.getBackendInfo()` bootstrap `useEffect` — dynamically sets backend origin from Electron IPC
- Added `GET /api/key-status` check on startup — shows `ApiKeySetup` modal if key is missing
- `ApiKeySetup` modal rendered conditionally

#### Build (`package.json` — root)
- Replaced all `npm run` scripts with PowerShell-safe equivalents using `Push-Location` / `Pop-Location`
- `electron-builder` configured with NSIS target, `extraResources` for `fx-server.exe`, output to `release/installer/`
- `tree-kill` added as runtime dependency for Electron main
- Electron pinned to `^32.3.3` (Node 18 compatible, Windows 8.1 compatible renderer)

#### Build (`backend/package.json`)
- `pkg ^5.8.1` added as dev dependency
- `build:pkg` script targets `node18-win-x64`
- `pkg.config.json` added — includes `keytar.node` as binary asset for pkg

#### Build assets
- `build/installer.nsh` — NSIS macro for Add/Remove Programs registry entry
- `build/icon-README.txt` — icon generation instructions

#### Docs
- `release/README.md` — full build, install, test, security, and rollback guide
- `CHANGELOG.md` — this file

### Changed
- `backend/tsconfig.json` — target downgraded to `ES2019` for Node 16/18 compatibility; added `resolveJsonModule`
- `scripts/dev.ps1` — rewrites to use `Push-Location`/`Pop-Location`, polls Vite before launching Electron
- `electron/main.js` — superseded by compiled `electron-src/main.ts` → `electron/main.js`

### Security
- **Zero-key policy enforced**: no `OPENAI_API_KEY` in any `.env` file, no key in any bundled file
- **127.0.0.1 binding enforced** in `backend/src/index.ts`
- **PII never logged** — SHA-256 hashes only
- **CSP** restricts renderer `connect-src` to `https://127.0.0.1:<port>` only
- **Cert pinning** between Electron main and renderer via IPC fingerprint transfer

### Rollback
See `release/README.md § Rollback instructions`.


## Creative Core Increment 2
- Added three-lens concept discovery and candidate ranking.
- Persisted candidate alternatives and selection rationale in CreativeIR.
- Added discovery events to the agent trace and lineage.
- Added docs/CREATIVE_CORE_INCREMENT2.md.


## Increment 3 — Creative Court (2026-10-25)
- Added an independent model-based Creative Court that compares every discovered concept against the same explicit creative rubric.
- Court reviews include scores, verdicts, evidence-based rationale, strengths, weaknesses, and next actions.
- The Court—not the discovery heuristic alone—selects the concept that proceeds to Script Writer.
- Added strict response validation and an explicitly labelled heuristic fallback so a failed/malformed judge response does not silently masquerade as model judgment.
- Persisted the Court decision in CreativeIR and run audit trace.
- Build/runtime validation remains pending because dependencies are not installed in this extracted archive.

## Increment 4 — Creative review and bounded revision

- Added an independent creative editor for the completed script, with six quality criteria and actionable revision notes.
- Added a single bounded revision pass driven by reviewer feedback and a second review of the revised output.
- Replaced field-presence-dominated final scoring with the reviewer score/verdict; fallback results are explicitly marked as heuristic.
- Stored review provenance and revision events in CreativeIR and the run trace.
- Build verification remains pending because dependencies/Node type definitions were unavailable in the working environment.

## Increment 5 — Creative Memory & Evolution Signals

- Added bounded, relevance-ranked creative lesson memory (`reinforce` / `avoid`) across runs in the same live backend process.
- Retrieves up to five lessons to guide discovery and script generation without copying previous concepts.
- Learns only from model-based creative reviews; structural fallback output is explicitly excluded from learning.
- Records retrieved/learned lesson IDs and memory status in CreativeIR, run records, audit traces, and lineage.
- Memory is process-local; durable persistence and audience-outcome learning are intentionally not claimed.
- Build verification remains pending because dependencies are not installed in the working environment.

## Increment 6 — Idea Metabolism Engine (2026-10-25)
- Added a bounded evolutionary pool with mutation and crossover attempts using the existing concept mapper.
- Preserved seed candidates when offspring generation fails; failures are recorded instead of aborting discovery.
- Added candidate origin, parent IDs, and generation metadata to CreativeIR.
- Routed the expanded candidate pool through the existing Creative Court so offspring do not bypass independent judgment.
- Added metabolism events and offspring counts to trace/CreativeIR summaries; capped additional generation at two attempts per run.
- Build verification remains pending until backend dependencies and Node.js type definitions are installed.

## Increment 7 — Creative Entropy Thermostat + Anti-Taste Memory
- Added pairwise lexical diversity diagnostics and one bounded attempt to diversify the most overlapping candidate.
- Added contextual retrieval of anti-taste lessons from Creative Memory.
- Integrated entropy outcomes into audit events and CreativeIR discovery metadata.
- Kept original candidates if regeneration fails or does not measurably reduce overlap.


## Increment 8 — Counterfactual Replay
- Added a bounded shadow run for the highest-ranked runner-up concept: one script generation and one independent review per main run.
- Compares the shadow review with the delivered script review and stores scores, delta, verdicts, interpretation, status, and limitations in CreativeIR.
- Uses Creative Court scores to select the runner-up where available; falls back to discovery scores only when necessary.
- Shadow failures are non-fatal and do not alter the primary script, review, or learned lessons.
- Marks comparisons inconclusive when either review is a structural fallback; no audience impact or causal superiority is claimed.
- Build/runtime verification remains pending until backend dependencies are installed and the TypeScript build succeeds.

## Increment 9 — Durable Creative Memory + Controlled Evaluation Ledger
- Replaced process-local-only memory with a versioned local JSON persistence layer for bounded creative lessons and counterfactual evidence.
- Added `TEXTFX_CREATIVE_MEMORY_PATH` for explicit storage location; default is `data/creative-memory.json` relative to the backend working directory.
- Uses temporary-file replacement and preserves unreadable/unsupported existing state rather than silently overwriting it.
- Added a bounded observe-only ledger for model-based counterfactual score deltas, with win/loss/tie counts and mean delta.
- Kept evaluation observational: counterfactual scores do not automatically alter creative selection or generation policy.
- Does not persist full briefs or scripts. Multi-process writers and end-to-end build remain unverified.

## Increment 10 — Automated Regression & Evaluation Framework
- Added dependency-free Node.js regression tests for Counterfactual Replay, fallback evidence boundaries, CreativeIR schema validation, and durable creative-memory persistence.
- Added a versioned JSON file of core regression invariants, explicitly separating software correctness from artistic-quality claims.
- Added `npm test` (build then tests) and `npm run test:unit` (tests against current `dist`).
- Tests use isolated temporary memory storage and clean it up; no default project memory file is changed.
- Full build/test pipeline remains uncertified until dependencies are installed and TypeScript compilation succeeds.

## Increment 12 — Creative Quality Lab
- Added a deterministic, human-scored benchmark aggregation module with weighted criteria, independent reviewer checks, missing-score warnings, and a three-reviewer completeness threshold by default.
- Added paired per-case comparisons between engine versions, including mean/median score deltas and win/loss/tie counts; unpaired or incomplete cases are excluded.
- Added a CLI report generator that consumes blind-review ratings and emits a versioned JSON report without changing generation policy.
- Added unit tests for benchmark validity, weighted scoring, reviewer sufficiency, invalid ratings, and paired comparisons.
- Reports explicitly avoid claims of statistical significance, causality, or audience impact. TypeScript full-build status remains pending until dependencies are installed.

## Increment 13 — Creative Experiment Orchestrator
- Added a two-phase workflow to prepare randomized blind review packets and apply hidden version mappings only after ratings are finalized.
- Requires at least two versions and exactly paired case coverage; rejects duplicate case/version outputs.
- Keeps version mapping in a separate owner-restricted file, strips version labels from reviewer packet metadata, and adds SHA-256 content hashes for integrity checks.
- Finalization rejects unknown artifact IDs, mismatched case IDs, duplicate reviewer submissions per artifact, and premature version labels.
- Added dependency-free tests and an artifact input template. The workflow does not call AI services or automatically change generation policy.
- Results remain descriptive; reviewer independence and successful blinding require human process controls.

## Increment 14 — Inter-rater agreement and experiment integrity

- Added `creative-inter-rater-agreement.cjs` for criterion-level exact/weighted agreement, score-spread alerts, and missing-score diagnostics.
- Experiment preparation now emits a manifest with stable SHA-256 hashes; finalization optionally verifies the packet and private mapping before unblinding.
- Added tests for tamper detection, blind mapping separation, missing ratings, invalid scores, and disagreement alerts.

## Increment 15 — Evidence-gated policy review

- Added `creative-policy-review.cjs` to produce an advisory dossier from quality, agreement, and finalized-ratings reports.
- Added explicit gates for integrity verification, paired case count, reviewer coverage, agreement, disagreement alerts, and paired deltas.
- Passing gates only permits human consideration of a controlled trial; automated generation-policy changes remain disabled.

## Increment 16 — Human trial governance

- Added `creative-trial-governance.cjs` for human approve/reject/defer decisions and a hash-chained audit ledger.
- Trial approval requires passed evidence gates, explicit approver/rationale, a bounded window, and rollback criteria.
- Added tamper detection and append-only behavior tests; automatic generation-policy changes remain disabled.

## Increment 17 — Creative run provenance

- Added private generation provenance with allowlisted metadata and SHA-256 commitments in experiment manifests.
- Added `creative-provenance-audit.cjs` to surface matching, differing, and missing model/prompt/config settings across versions.
- Added tests for blind-packet privacy, provenance integrity, invalid metadata, and comparison confounds.

## Increment 18 — Repeated-run stability analysis

- Added `creative-run-stability.cjs` to quantify within-version score variability and compare repeated outputs across versions.
- Added minimum-repeat gates and per-criterion variability; incomplete cases are excluded from paired comparison.
- Added tests for variance, repeat thresholds, missing versions, and invalid ratings.
