# TextFX Creative Core — Increment 1

This increment preserves the existing Insight → Concept → Script pipeline and adds a canonical `CreativeIR` representation after all stages complete.

## Changes
- Added `backend/src/core/creative-ir.ts` with a versioned CreativeIR contract, runtime validation, lineage metadata, provenance, and a compact summary function.
- Added optional `creativeIR` to `AgentRunRecord` without removing existing response fields, preserving compatibility with the current frontend.
- Integrated CreativeIR assembly and validation into `runAgent` after script generation and evaluation. Invalid assembled output fails the run instead of being marked complete.
- Added a compact CreativeIR summary to the completion trace.

## Intentional scope
- No SaaS, customer-management, EXE packaging, or database work was added.
- This is a foundation increment, not a claim that the full creative architecture is complete.
- The current trace/run stores remain in-memory; durable event sourcing is a later architectural step if requested.
- Runtime contract validation is dependency-free for this increment. It can be migrated to Zod once dependency installation and lockfile policy are established.

## Verification
A TypeScript build was attempted, but the provided archive has no installed `node_modules`; the build stops on missing existing dependencies and Node type declarations. This means a clean build has not yet been verified. Install backend dependencies using the project's package manager, then run `pnpm build` in `backend/`.

## Increment 5 — Creative Memory & Evolution Signals
- Added bounded lesson memory to carry selected reviewer lessons between runs within the same live backend process.
- Reuses relevant lessons as guidance for discovery and script generation; avoids storing full prior briefs/scripts.
- Learns only from model-based reviewer output and records provenance in CreativeIR and the trace.
- Memory is not durable across restarts; persistence and outcome-based learning remain future increments.

## Increment 6 — Idea Metabolism
- [x] Preserve multi-lens seed concepts
- [x] Attempt one bounded mutation and one bounded crossover
- [x] Record parent lineage and generation metadata
- [x] Submit all successful offspring to Creative Court
- [x] Keep generation failures non-fatal and visible in trace
- [ ] Verify full TypeScript build with installed dependencies
- [ ] Add durable memory and outcome-grounded learning in a later increment

## Increment 9 — Durable Creative Memory + Controlled Evaluation
- Creative lessons now survive ordinary backend restarts through a versioned local JSON state file.
- Counterfactual replay outcomes are recorded in a bounded evaluation ledger and summarized as aggregate diagnostics.
- Memory remains bounded (160 lessons; 200 comparison observations) and stores lesson/evaluation metadata rather than complete creative artifacts.
- Persistence failures are surfaced as `volatile` status with a diagnostic; malformed/unsupported files are preserved rather than overwritten.
- No automatic policy optimization is inferred from reviewer scores alone.

## Increment 10 — Automated Regression & Evaluation

- Added 6 deterministic Node.js tests covering counterfactual runner-up choice, comparison interpretation, fallback exclusion from quality claims, CreativeIR schema version rejection, model-only learning, and durable evidence persistence.
- Added a versioned regression-case manifest describing core invariants.
- Verified `npm run test:unit`: **6 passed, 0 failed** against the included compiled `backend/dist` modules.
- A clean TypeScript rebuild was not verified in this environment because the full dependency tree/type definitions are not installed. `npm test` deliberately performs a build first so it won't silently treat stale compiled output as a clean build.
- These tests validate software safeguards, not artistic quality or audience effectiveness.


## Increment 12 — Creative Quality Lab

Added a human-scored benchmark aggregation module, weighted per-artifact scores, completeness checks requiring three reviewers by default, paired version comparisons, a JSON report CLI, and deterministic tests. Current compiled JavaScript suite: 15/15 passing. Full TypeScript build still requires dependency-complete verification. The lab is observational and does not automatically alter creative strategy.

## Increment 13 — Creative Experiment Orchestrator

- Added controlled paired-version experiment preparation with randomized artifact order and opaque blind IDs.
- Writes reviewer packet separately from confidential version mapping; mapping and output files are created with owner-only permissions where supported.
- Requires every compared version to use the same benchmark case IDs and rejects duplicate case/version entries.
- Finalizes blind ratings after scoring by joining opaque artifact IDs to hidden version labels, with duplicate-reviewer and mismatch checks.
- Added tests for packet privacy boundaries, paired coverage, mapping application, and invalid rating submissions. No model calls or generation policy changes are involved.
- These controls improve experiment reproducibility but cannot independently guarantee reviewer blinding or establish statistical significance, causality, or audience impact.


### Increment 14
- Added descriptive inter-rater agreement diagnostics and a hash-backed experiment integrity manifest.
- This supports auditability but does not establish statistical significance or creative validity; no generation-policy changes are automatic.


### Increment 15
- Added evidence-gated review dossiers that make the rationale and failed gates explicit.
- Dossiers are advisory-only; passing all gates never triggers an automatic strategy change.


### Increment 16
- Added a human decision and rollback ledger with SHA-256 hash chaining.
- Approval cannot proceed when evidence gates fail; even a valid approval records permission for a controlled trial, not an automatic engine change.


### Increment 17
- Added provenance capture and audit to improve experiment reproducibility. Metadata is excluded from blind packets and is only unblinded after rating finalization.
- Provenance matching improves comparability but does not establish causal impact or creative quality.


### Increment 18
- Added repeated-run stability analysis so a single output is not mistaken for a reliable version-level pattern.
- Reports remain descriptive; independent run provenance and actual human ratings are still required.
