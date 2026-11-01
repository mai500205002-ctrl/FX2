# FX2 — Master Engineering Roadmap & Project Completion Blueprint

**Repository:** `mai500205002-ctrl/FX2`  
**Primary branch:** `main`  
**Project:** TextFX Creative Core  
**Authority:** This document is the controlling engineering roadmap for FX2. If older project notes, increment prompts, archives, or reports conflict with this document, this roadmap governs the current execution scope.

> **Status discipline:** This is the approved execution plan, not evidence that every listed capability is implemented or accepted. Implementation status must be established from the current source tree, tests, runtime observations, and reproducible logs.

---

## 1. Mission and completion objective

Complete the existing TextFX Creative Core as a reliable, evidence-aware, single-user creative intelligence backend. The system should support brief intake, lateral-thinking discovery, candidate generation, critique, revision, evidence gathering, creative evaluation, and final artifact production while preserving the project's existing techniques and working architecture.

The objective is to complete and verify the backend—not to expand the product into an unrelated commercial platform.

## 2. Controlling scope and exclusions

### In scope until backend final acceptance
- Existing backend architecture, APIs, services, domain contracts, persistence, provider integrations, evidence handling, security, observability, and automated tests.
- Incremental repair and completion of existing capabilities.
- Backend documentation, test matrices, gap analysis, risk register, and reproducible acceptance evidence.
- Single-user operation only.

### Explicitly deferred
- Frontend product work and redesign.
- Electron desktop integration and packaging.
- Android, mobile, and other client applications.
- SaaS conversion, multi-tenancy, customer management, billing, subscriptions, and commercial account systems.
- New databases, infrastructure, deployment platforms, frameworks, or distributed architecture unless a demonstrated backend requirement makes one necessary.

Deferred work is not deleted from the product's long-term vision; it is simply not a prerequisite for backend closure.

## 3. Non-negotiable engineering rules

1. Preserve the existing TextFX techniques, prompts, contracts, and proven behavior.
2. Extend the current architecture; do not restart or replace it without evidence and explicit justification.
3. Reuse existing modules and APIs. Avoid duplicate services and parallel implementations.
4. Maintain backward compatibility unless a breaking change is necessary, documented, and tested.
5. Keep single-user boundaries explicit; do not introduce multi-tenant assumptions.
6. Distinguish real provider output, deterministic fixtures, mocks, synthetic evaluations, and verified real-world outcomes.
7. Never silently fall back from a failed real model call to a mock.
8. Preserve provenance for prompts, model/provider, run, candidate, artifact, evidence, review, and decision.
9. Do not claim creative-quality improvement without a defined benchmark and measured results.
10. Do not claim a feature works because its files or routes exist. Verify wiring, execution, tests, and runtime behavior separately.
11. No paid LLM/API operation without prior user approval. Before any paid operation, state the expected cost, limits, risks, and exact action.
12. No destructive data operation, public deployment, irreversible security decision, or scope expansion without explicit approval.
13. No source edits, commits, pushes, or deployments unless the user has explicitly authorized the specific action. Routine implementation autonomy applies only inside an approved increment and its stated boundaries.
14. Never expose credentials, tokens, private keys, or secret values in logs, reports, test output, or documentation.
15. Work incrementally. Complete and verify an increment before starting the next.
16. Record exact commands, exit codes, test counts, and limitations. Mark unavailable tests as **NOT RUN** with the reason; never imply they passed.
17. Preserve historical reports, archives, and raw logs. Do not overwrite source archives or erase prior checkpoints.
18. Keep changes minimal, reversible, and tied to an acceptance criterion.

## 4. Evidence and status vocabulary

Every audit and increment must classify each capability using these distinctions:

- **Present:** source or configuration exists.
- **Wired:** reachable through the intended runtime path.
- **Tested:** covered by an identified automated or manual test.
- **Executed:** the relevant command or runtime path was actually run.
- **Verified:** observed result meets a stated acceptance criterion and has reproducible evidence.
- **Partial / Missing / Blocked / Not verified:** use when appropriate; explain the evidence and reason.

Do not convert a report's historical claim into a current fact without rechecking it against the commit and test run it describes.

## 5. Execution lifecycle

Each increment follows this sequence:

1. Define objective, boundaries, dependencies, and acceptance criteria.
2. Inspect the current implementation and identify reusable modules.
3. Record the baseline and exact starting HEAD.
4. Make only the minimum approved changes.
5. Add or update focused tests.
6. Run focused tests and relevant regression tests.
7. Run applicable typecheck, lint, build, and security checks.
8. Inspect failures and repair regressions caused by the increment.
9. Record exact commands, exit codes, results, and tests not run.
10. Update documentation and the relevant matrices.
11. Preserve a clean checkpoint/report/archive where required by the existing project conventions.
12. Verify the final worktree/commit state before proceeding.

An increment is not complete merely because implementation has stopped; it is complete only when its acceptance criteria are evidenced or explicitly marked blocked.

---

## 6. Phases and increments

The backend program is organized into 15 phases and 19 increments (BE-00 through BE-18). Phase boundaries are gates; increment details may be refined after repository inspection, but scope may not silently expand.

### Phase 0 — Repository baseline and custody
**Increment BE-00 — Baseline, repository identity, and reproducibility**

- Confirm repository, branch, current HEAD, working-tree state, and source-of-truth directory.
- Inventory source, tests, docs, reports, archives, manifests, lockfiles, scripts, and environment examples.
- Identify runtime/toolchain versions and supported commands.
- Preserve current state and baseline logs; do not overwrite archives.
- Run existing baseline checks where safe and available.
- Record test totals and failures exactly, tied to commit SHA and command.
- Identify missing artifacts or discrepancies before implementation.

**Gate:** a reproducible baseline record exists; unresolved baseline blockers are explicit.

### Phase 1 — Reverse engineering and architecture reconstruction
**Increment BE-01 — Backend architecture and execution-flow map**

- Trace request entrypoints, middleware, route registration, services, agents, provider calls, persistence, and output serialization.
- Map the Brief-to-final-artifact flow.
- Inspect CreativeIR, discovery techniques, Creative Court, Creative Reviewer, Creative Memory, Idea Metabolism, Creative Entropy, Counterfactual Replay, evaluation, evidence, Browser Agent, provenance, and provider adapters.
- Identify module ownership, duplicate logic, hidden coupling, and compatibility constraints.
- Separate implemented, partial, missing, and unverified capabilities.

**Gate:** architecture map and evidence-backed gap inventory are reviewed before feature work.

### Phase 2 — Backend gap closure planning
**Increment BE-02 — Gap, coverage, dependency, and risk baselines**

Produce and maintain:
- `BACKEND_GAP_MATRIX.md`
- `TEST_COVERAGE_MATRIX.md`
- Backend risk/dependency/defect register
- API and contract inventory
- First executable increment proposal with scope, risk, dependencies, and acceptance tests

Prioritize correctness, security, provenance, persistence, and end-to-end backend reliability. Do not reimplement capabilities already present and verified.

**Gate:** the next increment is the smallest evidence-supported unit of work.

### Phase 3 — Runtime, configuration, and service foundations
**Increment BE-03 — Runtime and configuration integrity**

- Validate startup configuration and required/optional environment variables.
- Make invalid or unsafe production configuration fail explicitly.
- Keep secrets server-side and redact them from diagnostics.
- Verify health/readiness semantics and service shutdown behavior.
- Document runtime assumptions and supported execution modes.

**Increment BE-04 — Backend service and API contract integrity**

- Inventory and validate route registration, middleware order, request validation, response schemas, error semantics, and compatibility.
- Verify that protected routes are actually protected and exemptions are narrowly scoped.
- Test malformed input, unsupported methods, size limits, and failure paths.
- Preserve existing clients and contracts unless an approved migration is required.

### Phase 4 — Authentication, authorization, and security
**Increment BE-05 — Authentication and session hardening**

- Audit API-key, session, browser-agent, and approval-token flows against the current code and tests.
- Verify credential handling, token generation, storage, expiry, logout, origin checks, cookie flags, TLS assumptions, rate limits, and route exemptions.
- Verify fail-closed behavior when required secrets are absent in protected environments.
- Review constant-time comparisons where secret comparison is required.
- Document process-restart and persistence semantics of sessions.
- Add focused tests for valid, invalid, missing, expired, revoked, and incorrectly scoped credentials.

**Required roadmap note:** Authentication findings raised during the earlier repository explanation are **audit leads, not confirmed current defects**. Revalidate them against the active HEAD before classifying or fixing them. Specifically inspect: behavior when `TEXTFX_API_KEY` is unset; bearer and approval-token comparison behavior; in-memory session storage and restart invalidation; browser-route exemptions and independent browser authentication; Origin/CORS/cookie behavior; and Electron TLS health-check behavior. Electron remediation remains deferred unless it blocks a backend acceptance criterion.

**Increment BE-06 — Authorization boundaries and security regression suite**

- Map every privileged operation to an explicit authorization decision.
- Ensure approval is bound to the intended action/artifact and cannot be replayed against changed content.
- Test unauthorized access, privilege boundaries, route bypasses, request forgery protections, and security-sensitive error handling.
- Maintain a threat model proportionate to a single-user local/cloud backend.

**Gate:** no known critical/high security issue remains unexplained; all exceptions are documented and accepted.

### Phase 5 — Creative domain contracts
**Increment BE-07 — CreativeIR and domain contract completion**

- Inspect and preserve existing CreativeIR contracts and versioning.
- Validate prompt/rubric versions and artifact/candidate identities.
- Keep Run lifecycle state distinct from Idea verdicts and artifact review state.
- Validate serialization, schema evolution, compatibility, and invalid-state rejection.
- Ensure evidence references remain explicitly unreviewed until reviewed.

### Phase 6 — Discovery and creative generation
**Increment BE-08 — Discovery lenses and candidate generation**

- Preserve the established TextFX lateral-thinking techniques and prompts.
- Make each discovery lens independently identifiable and attributable.
- Preserve lens ID, prompt version, run ID, model provenance, and candidate lineage.
- Keep candidate sets distinct; handle partial lens failures explicitly.
- Validate all candidates against CreativeIR.
- Avoid unbounded parallelism and uncontrolled model spend.

### Phase 7 — Critique, revision, and creative evaluation
**Increment BE-09 — Creative Court and rubric evaluation**

- Use explicit, versioned rubrics.
- Produce structured scores, objections, rationale, and decisions.
- Separate rubric scores from evidence of real-world success.
- Keep idea-level verdicts separate from Run status.

**Increment BE-10 — Creative Reviewer and bounded revision**

- Each objection identifies candidate/version, criterion/rubric version, defect, rationale/evidence, proposed fix, and verification test.
- Enforce a maximum of two revision attempts.
- Preserve revision and decision history.
- Never silently approve unresolved objections.

### Phase 8 — Memory, diversity, and idea evolution
**Increment BE-11 — Creative Memory, Idea Metabolism, and Creative Entropy**

- Reuse existing memory and evolution mechanisms.
- Distinguish facts, preferences, creative history, synthetic evaluations, and verified outcomes.
- Track source and confidence for memory-derived information.
- Reduce repetition while preserving meaningfully distinct candidates.
- Never fabricate missing history.
- Document persistence and restart behavior accurately.

### Phase 9 — Evidence and research integrity
**Increment BE-12 — Browser Agent and evidence ledger hardening**

- Preserve the existing restricted, read-only Browser Agent model.
- Test host allowlists, DNS validation, IP pinning, redirects, private/link-local targets, IPv4/IPv6 edge cases, size limits, timeouts, content types, and SSRF protections.
- Treat retrieved content as untrusted data, never as instructions.
- Fail closed on browser-policy violations and unsafe fetch failures.
- Preserve source URL, retrieval time, content hash, snapshot ID, extraction metadata, and review state.
- Distinguish source text from model summaries and interpretations.
- Do not add autonomous login, purchasing, publishing, form submission, or other consequential browser actions.

**Increment BE-13 — Claim review and evidence-to-claim linkage**

- Identify factual and consequential claims.
- Link claims to relevant evidence references.
- Classify claims as supported, unsupported, contradictory, or unreviewed with rationale.
- Require human review where risk warrants it.
- Do not mark a claim verified merely because a URL exists or text is semantically similar.
- Preserve claim/evidence status through revisions and final artifacts.

### Phase 10 — Model gateway and budget governance
**Increment BE-14 — Provider gateway, routing, and explicit mock mode**

- Inspect and reuse existing provider integrations.
- Centralize model calls through a gateway where the actual architecture requires it.
- Keep provider-specific request/response handling in adapters.
- Make provider/model routing configurable and inspectable.
- Preserve provider, model, prompt version, usage, and error provenance.
- Handle timeouts, retries, rate limits, malformed responses, and provider failures explicitly.
- Mock mode must be explicit, visible, and attributable; never silently substitute for a real call.
- Add or extend providers only when supported by actual configuration and approved scope.

**Increment BE-15 — Budget reservation and enforcement**

- Define run-level and call-level limits.
- Reserve budget before model calls and reconcile estimated versus actual usage.
- Test concurrent reservations and idempotency.
- Define failure, retry, timeout, and uncertain-usage behavior.
- Use storage appropriate to the actual single-user deployment model.
- Do not claim cross-process atomicity from an in-memory counter.
- Stop or reject work when limits are exhausted.
- No paid live call without explicit user approval and a cost/risk statement.

### Phase 11 — Run reliability and provenance
**Increment BE-16 — Run lifecycle, event history, idempotency, and recovery**

- Define and validate legal Run state transitions.
- Keep Run state separate from candidate/artifact states.
- Record append-only events for significant transitions and decisions.
- Include actor/component, event type, timestamp, run ID, artifact version, and correlation IDs.
- Reconstruct recorded state without regenerating saved model outputs.
- Use stable idempotency keys to prevent duplicate work.
- Recover interrupted runs from persisted state and distinguish retryable from permanent failures.
- Add a transactional outbox only if reliable asynchronous dispatch demonstrably requires it.
- Avoid full event sourcing unless justified.

**Increment BE-17 — Approval integrity and end-to-end provenance**

- Bind approvals to exact artifact hash/version, policy version, and evidence set.
- Invalidate approvals when relevant content or policy changes.
- Preserve lineage from Brief through prompts, provider calls, candidates, critique, evidence, revisions, and final artifact.
- Test approval replay, stale approval, changed evidence, and artifact mutation cases.

### Phase 12 — Test, quality, and regression closure
**Increment BE-18 — Backend verification and acceptance readiness**

- Consolidate unit, contract, integration, security, persistence/recovery, and end-to-end tests.
- Verify all backend API paths and important negative cases.
- Reconcile historical test-count discrepancies against exact commits and commands.
- Add deterministic fixtures without misrepresenting them as live provider/browser tests.
- Run typecheck, lint, build, test, dependency/security checks where configured.
- Establish fixed creative-quality/diversity/duplication benchmarks; report measurements without unsupported quality claims.
- Run performance checks against documented single-user expectations.
- Produce a final defect list, coverage matrix, risk register, and acceptance evidence.

### Phase 13 — Stabilization and release candidate
- Freeze backend scope except for acceptance-blocking defects.
- Re-run the full required backend suite from a clean, documented state.
- Verify configuration and secret handling without exposing secret values.
- Verify clean startup, health/readiness, API behavior, persistence, recovery, and shutdown.
- Record all unavailable external/browser/provider checks as NOT RUN.
- Produce a release-candidate report and reproducible checkpoint.

### Phase 14 — Final backend acceptance and handoff
Backend is accepted only when:
- All mandatory backend increments are verified or explicitly dispositioned.
- No unresolved critical/high defect remains without a documented, approved exception.
- Required tests pass on the recorded final HEAD.
- API and domain contracts are documented and compatible.
- Authentication, authorization, evidence integrity, provider governance, budget controls, run recovery, and approval integrity meet their criteria.
- Known limitations and NOT RUN tests are explicit.
- The repository is clean and the final commit/branch state is recorded.
- A handoff package allows another engineer to continue without repeating discovery.

**Only after this gate may the user authorize the next client phase** (Frontend, Electron, Android/mobile, or other deferred work). Passing backend acceptance does not itself authorize that work.

---

## 7. Required engineering artifacts

Maintain these in the repository as work progresses, without inventing results:

- `MASTER_ENGINEERING_ROADMAP.md` — this controlling roadmap.
- `BACKEND_GAP_MATRIX.md` — capability, evidence, status, gap, priority, and target increment.
- `TEST_COVERAGE_MATRIX.md` — requirement-to-test mapping, command, result, commit, and limitations.
- `BACKEND_RISK_REGISTER.md` — risk, likelihood/impact, evidence, mitigation, owner, and status.
- `BACKEND_ARCHITECTURE_MAP.md` — request flow, modules, contracts, provider and persistence boundaries.
- `BACKEND_ACCEPTANCE_REPORT.md` — final acceptance evidence and outstanding exceptions.
- Increment reports and raw logs following the repository's existing naming conventions.

## 8. Increment report template

Each increment report must include:

1. Increment ID and title.
2. Starting and ending HEAD.
3. Objective and acceptance criteria.
4. Files inspected and files changed.
5. Existing modules reused.
6. Implementation summary.
7. Tests and exact commands.
8. Exit codes, counts, and results.
9. Tests not run and reasons.
10. Security, compatibility, cost, and data risks.
11. Known defects and limitations.
12. Evidence links/log paths.
13. Explicit completion status and next increment.

## 9. Session handoff checkpoint

At the end of every engineering session, report:

- Current repository and branch.
- Current HEAD.
- Current phase and increment.
- Last verified increment.
- Files inspected and modified.
- Tests executed and exact results.
- Known defects and blockers.
- Next exact task.
- Approvals required (especially paid calls, destructive actions, scope changes, commits, pushes, and deployments).

## 10. Initial next action

Start with **BE-00 / Phase 0**, read-only. Confirm the live repository HEAD and working-tree context, inventory the current root and project directory, and reconcile the roadmap with existing reports. Do not start implementation or treat historical reports as current verification. Then complete BE-01 and BE-02 to produce the architecture map, gap matrix, coverage matrix, and risk register before selecting the first implementation increment.

---

**Controlling decision:** Backend-only, single-user completion remains the active scope until final backend acceptance. The roadmap is a plan and governance contract; all completion claims require current, reproducible evidence.
