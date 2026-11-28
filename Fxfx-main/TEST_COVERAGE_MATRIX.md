# Backend Test Coverage Matrix — BE-02

Status: file-level static mapping; execution is not re-certified by BE-02
Repository: mai500205002-ctrl/FX2
Branch / HEAD inspected: `main` / `fa6192628e08d6f7064851328e75dad802b196a0`
Review date: 2026-11-28
Suite command: `npm run test:unit` → `node --test tests/*.test.cjs`
Build command: `npm run build` → `tsc -p tsconfig.json`

## Baseline record

The latest recorded BE-00 invocation for this worktree reported build success and **224 tests, 224 pass, 0 fail, 0 skipped**. It included the then-existing uncommitted fixture change in `tests/discovery-lenses.test.cjs`; it was not run on a clean worktree containing only commit `fa6192628e08d6f7064851328e75dad802b196a0`. No tests or build were run during BE-02. Historical totals in 2026-11-27 reports refer to older SHA/tooling and are not current execution evidence.

There are 27 `*.test.cjs` files in `backend/tests/`. Coverage below is an inventory from filenames and test declarations, not a statement that all behaviors, branches, external environments, or security properties are covered.

## File-to-capability map

| Test file | Existing focus visible in test declarations | Coverage boundary / follow-up |
|---|---|---|
| `agent-idempotency.test.cjs` | Same-key concurrency, persisted retry replay, interrupted runs on restart. | Process-local coordination and multi-process races are not established. |
| `agent-pipeline.test.cjs` | Mocked Agent stages, Court score/selection validation, revision bound, fallback handling, browser evidence and objections. | Mocked provider path; not a paid/live provider execution. |
| `agent-run-store.test.cjs` | Snapshot/event/idempotency reload, lifecycle projection, corrupt event log handling. | Local filesystem only; injected disk-full/partial-write and cross-process behavior remain unverified. |
| `approval-integrity.test.cjs` | Approval binds artifact/version/policy/evidence and invalidates on change. | Cryptographic binding logic; not the entire HTTP authorization/deployment path. |
| `browser-agent.test.cjs` | URL/DNS/IP policy, token auth, pinned transport, snapshot lifecycle and Browser HTTP routes. | Chromium lifecycle/runtime availability is separately covered only in selected tests; deployed network environment is not certified. |
| `candidate-archive.test.cjs` | Candidate decisions persist, reload and deduplicate. | Candidate archive and Agent run persistence are not one transaction. |
| `core-contracts.test.cjs` | CreativeIR validation, compatibility, evidence state, phase/verdict separation, provenance versions. | Does not prove every future schema migration or response contract. |
| `creative-core.test.cjs` | Counterfactual selection/comparison and Creative Memory filtering, bounds, quarantine and reload. | Memory persistence failure in a full Agent run needs integration fault injection. |
| `creative-experiment-orchestrator.test.cjs` | Blinded packet, hidden mapping, manifest hashes and input validation. | Offline experimental workflow; no claim of actual human study execution. |
| `creative-inter-rater-agreement.test.cjs` | Agreement calculation and invalid/incomplete rating handling. | Statistical method and sample adequacy remain limited as documented by implementation. |
| `creative-policy-review.test.cjs` | Evidence gates, paired-case/reviewer-agreement policy and invalid dossiers. | Offline governance evaluation, not wired as a generation route gate. |
| `creative-provenance-audit.test.cjs` | Runtime/model/prompt confound and provenance validation. | Does not prove runtime provenance is complete beyond bounded Gateway history. |
| `creative-quality-lab.test.cjs` | Human rating aggregation, paired comparison, lexical diversity and benchmark CLI. | Functions/tests do not establish creative quality without actual human ratings. |
| `creative-run-stability.test.cjs` | Repeated-run variability and insufficient-repeat rejection. | Requires real repeated artifacts/ratings before empirical stability claims. |
| `creative-trial-governance.test.cjs` | Trial gates, rollback criteria and append-only ledger integrity. | Governance artifact validation, not deployment or automatic policy change. |
| `discovery-lenses.test.cjs` | Five-lens attribution/failure isolation, lexical ranking, metabolism partner and entropy target selection. | Lexical heuristics only; no semantic originality proof. Current worktree contains a one-line fixture adjustment. |
| `evaluation-lab.test.cjs` | Benchmark fixture, metric separation, experiment tracking and regressions. | Offline lab modules; not a live quality gate. |
| `frontend-product-flow.test.cjs` | Frontend-to-backend key/session behavior, provider selection, cancellation and response handling. | Selected integrated flows; not exhaustive route-contract or deployed-browser verification. |
| `full-pipeline-e2e.test.cjs` | Authenticated direct pipeline, invalid/truncated outputs, provider failures, budgets and cancellation. | Covers `/api/full-pipeline`; it is not equivalent to the full Agent Orchestrator. |
| `gateway-budget.test.cjs` | Reservation, call cap, charges, cache scope, timeout, malformed usage and HTTP budget errors. | Process-local budgets; no distributed atomicity guarantee. |
| `gemini-gateway.test.cjs` | Gemini routing, cache/dedup and task routing/provenance. | Other adapter semantics are covered in provider-routing tests; live credentials are not implied. |
| `increment22-browser-hardening.test.cjs` | SSRF/DNS pinning, redirects, content limits, cancellation, claims gate, integrity, snapshots and selected real-TCP cases. | Test-injected/local sockets do not certify every production network or Chromium deployment. |
| `provider-routing.test.cjs` | Adapter selection/model allowlist, key redaction, safe fallback, ambiguity and cancellation. | Agent display mode versus actual provider selection remains a focused test gap. |
| `release-candidate-e2e.test.cjs` | CreativeIR/provenance E2E, provider outage, budget exhaustion, evidence tampering, approval gate and HTTP compatibility. | Single controlled test harness; not every method/path/configuration permutation. |
| `research-stage-context.test.cjs` | Evidence references/excerpts across Insight→Concept→Script and untrusted-data instruction boundary. | Tests pipeline context propagation, not truth/verification of source claims. |
| `saas-route.test.cjs` | Registration key visible once; usage read redacts it. | Demo in-memory scaffold; not production auth, quotas, persistence or multi-tenancy. |
| `security-governance.test.cjs` | Input policy, redaction, run IDs, API auth/session, loopback, approval, headers, deletion and revocation. | Strong unit/integration coverage exists; still needs BE-05/06 route-by-route and deployed-config audit. |

## Capability summary and uncovered acceptance work

| Capability | Test evidence exists | Remaining coverage target |
|---|---|---|
| Direct Insight→Concept→Script pipeline | Yes: full-pipeline E2E, frontend flow, research context | Inventory exact contract for every direct API endpoint and compare legacy pipeline with Agent behavior. |
| Agent orchestration | Yes: mocked pipeline, idempotency, run store, release-candidate E2E | Explicit Agent provider-selection/mode consistency; persistence failure fault injection. |
| Gateway/providers/budget | Yes: Gateway budget, Gemini and provider routing | Process-local boundary; test full provenance completeness when call history is bounded. |
| CreativeIR/candidate decisions | Yes: core contracts, candidate archive, discovery and creative-core | API serialization/version compatibility for all output paths. |
| Auth/session/approval | Yes: security-governance, approval-integrity, Agent pipeline | Reconcile every route's exemption and auth policy with the actual deployment configuration. |
| Browser evidence/SSRF policy | Yes, extensive: browser-agent, Increment22, research and Agent integration | Supported Chromium/deployment acceptance; preserve explicit unreviewed status across all output paths. |
| Creative Memory/evaluation | Yes: creative-core and offline quality/governance suites | Persistence-failure integration and keep human evidence distinct from model-generated evaluation. |
| SaaS scaffold | Narrow test present | Keep marked demo/not-ready; multi-tenant behavior is outside the single-user scope. |
| API compatibility | Selected E2E contract tests present | Per-route matrix for malformed payload, wrong method, status/error shape and auth. |

## Required execution discipline

Before using this matrix as a pass/fail report, run from a pinned, recorded tree:

```bash
npm run build
npm run test:unit
```

Record SHA, `git status --short`, Node/npm versions, exact command and exit code, test/pass/fail/skipped counts, and failing test names. A passing test file declaration is not closure evidence; close a row only after executing the relevant acceptance test on the intended tree.
