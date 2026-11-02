CRITICAL TASK & IMMEDIATE EXECUTION REQUIRED:

Restore backend fixture: Re-create missing backend/tests/fixtures/key.pem with a valid self-signed test key/cert pair.
Run test suite: Execute cd backend && npm test and ensure all tests pass (Exit Code 0).
IMMEDIATE GIT PUSH (HIGHEST PRIORITY):
Run git add .
Run git commit -m "fix(backend): restore key.pem fixture and finalize Increment 24"
Run git push origin main (or the active branch) to guarantee all updated code is safely stored on GitHub right away.
Do not start Increment 25 until the Git push is completely successful. Execute immediately.

Free
7 minutes ago

User: TEXTFX CREATIVE CORE — MASTER EXECUTION PLAN

Autonomous Engineering Roadmap: Increment21 Through Final Release

ROLE

Act as the lead software architect, senior engineer, creative-systems engineer, security reviewer, and test engineer responsible for completing the existing TextFX Creative Core project.

You are expected to inspect the actual repository, understand the existing implementation, make careful incremental changes, execute the project, test your work, fix failures, and deliver a verified final release.

You have authorization to work autonomously through the roadmap below. Do not require the user to approve every routine implementation decision or ask what to do next after each increment.

However, autonomy does not mean making unsupported assumptions, silently skipping tests, deleting working functionality, or reporting unverified success.

Make reasonable engineering decisions independently. If something is genuinely blocking, state the exact blocker, the evidence, and the smallest decision needed.

---

PART 1 — PROJECT CONTEXT AND SOURCE OF TRUTH

The project is TextFX Creative Core, a creative intelligence system based on TextFX-style lateral thinking, idea generation, critique, revision, evidence gathering, and creative evaluation.

The project has progressed through Increment20.

The reported Increment19.1 baseline includes:


- A TypeScript backend and frontend.
- A Browser Agent with restricted, read-only research capabilities.
- Evidence snapshots, hashes, provenance, and review-state controls.
- Existing creative-agent functionality and API endpoints.
- 71 original tests.

The reported Increment20 implementation includes:


- Versioned CreativeIR contracts.
- Explicit prompt and rubric versions.
- Evidence references that remain unreviewed until reviewed.
- A distinction between Run state and Idea verdicts.
- 10 additional contract tests.
- A reported total of 81 passing tests.
- Existing API compatibility checks.

IMPORTANT: These are reported facts, not permission to assume that every capability exists in the repository. Inspect the actual files, reports, tests, and implementation before relying on them.

The Increment20 archive and its raw logs are the starting point. If the archive is not present, ask for that exact missing artifact. Do not silently substitute an older project version.

Fundamental engineering principles


1. Preserve the existing TextFX implementation and proven creative techniques.
2. Extend the existing architecture instead of replacing it.
3. Reuse working modules rather than creating duplicate implementations.
4. Keep existing API routes and behavior backward-compatible unless a change is necessary and documented.
5. Never use mocks as silent fallbacks for failed real model calls.
6. Clearly distinguish real model output, deterministic test fixtures, synthetic evaluations, and real-world outcomes.
7. Every significant artifact, decision, and evaluation must have traceable provenance.
8. Do not claim that a feature works merely because its files exist.
9. Do not claim that creative quality improved without benchmark evidence.
10. Avoid unnecessary abstractions, excessive frameworks, and premature distributed-system complexity.
11. Keep the project focused on creative intelligence. Do not turn the roadmap into an unrelated SaaS, CRM, billing, or customer-management product.
12. Do not introduce a new frontend architecture, browser framework, database, or deployment system unless a demonstrated requirement justifies it.

---

PART 2 — INITIAL REPOSITORY AUDIT

Before implementing anything:


1. Identify the exact starting archive and its contents.
2. Extract it into a clean working directory.
3. Record the repository structure, runtime versions, dependency manifests, lockfiles, scripts, and environment requirements.
4. Read the previous increment reports and inspect the corresponding source code.
5. Trace the actual request flow from the incoming Brief to the final creative artifact.
6. Inspect the current implementations of:
- CreativeIR
- Discovery Engine and lateral-thinking techniques
- Creative Court
- Creative Reviewer
- Creative Memory
- Idea Metabolism
- Creative Entropy
- Counterfactual Replay
- Evaluation and experiment components
- Browser Agent and evidence storage
- Agent service and provenance
- Existing model-provider integrations
- All API routes and frontend consumers
7. Identify the actual persistence model and its restart behavior.
8. Run the existing installation, build, typecheck, and test commands.
9. Save the baseline logs and test counts before changing code.
10. Produce a short internal implementation map identifying implemented, partial, missing, and unverified capabilities.

Do not repeat a capability already implemented and tested.

Do not edit the source during this initial audit unless a change is required to make the baseline testable; document any such exception.

If the existing baseline cannot be built, isolate and document the cause before starting feature development.

---

PART 3 — EXECUTION POLICY

Work through the increments in order.

You may plan the entire roadmap at once, but implement, test, and stabilize one increment before starting the next.

For each increment:


1. State the goal and acceptance criteria.
2. Identify existing modules to reuse.
3. Identify the smallest necessary set of source changes.
4. Implement the change.
5. Add or update automated tests.
6. Run focused tests.
7. Run the relevant regression suite.
8. Run backend and frontend builds when applicable.
9. Inspect failures and fix regressions caused by the change.
10. Record exact commands, exit codes, and results.
11. Update the documentation.
12. Create a clean, reproducible checkpoint archive and increment report.
13. Continue to the next increment only after the acceptance criteria are satisfied.

If a test cannot run because a credential, operating system, browser runtime, or external service is unavailable, mark it NOT RUN and explain why. Never substitute a mocked result and call it a live test.

Do not delete prior checkpoint archives or raw logs.

Do not overwrite the source archive. Maintain a separate working copy and preserve a recoverable baseline.

Use deterministic test fixtures for unit tests. Use real external calls only when credentials and the environment are explicitly available and the test is safe to perform.

Never print API keys, passwords, tokens, or other secrets in reports or logs.

If a requirement is ambiguous but does not block safe implementation, choose the simplest backward-compatible interpretation and document it. Ask the user only when the decision is genuinely blocking or would involve destructive changes, significant external spending, public deployment, or an irreversible security or data decision.

Do not stop after writing a plan. Execute the work available in the repository.

---

PART 4 — INCREMENT21: CREATIVE PIPELINE

Goal

Unify and improve the actual creative generation flow without replacing the original TextFX techniques.

21.1 — Five independent discovery lenses


1. Inspect the five established TextFX lateral-thinking techniques in the repository.
2. Preserve the proven system prompts and micro-prompts.
3. Make each technique independently identifiable and attributable.
4. Generate separate candidate sets for each lens rather than collapsing all reasoning into one undifferentiated Insight.
5. Preserve each candidate's lens ID, prompt version, run ID, and provenance.
6. Validate candidates against the existing CreativeIR contract.
7. Handle a lens failure without silently fabricating successful output or discarding valid candidates from other lenses.
8. Avoid unnecessary parallel execution if it would exceed the configured budget or compromise reproducibility.

21.2 — Candidate archive


1. Reuse the existing persistence and candidate-history mechanisms where possible.
2. Give each candidate a stable identity and version.
3. Preserve rejected, revised, accepted, and blocked candidates with their reasons.
4. Record which candidate led to which revised artifact.
5. Avoid accidental overwrites and duplicate identities.
6. Document whether archive data survives process restarts.
7. Do not claim durable memory if the implementation is only in-memory.

21.3 — Creative Court


1. Use explicit rubric versions.
2. Evaluate candidates against documented criteria.
3. Return structured scores, objections, rationale, and decisions.
4. Keep idea-level decisions separate from Run status.
5. Distinguish rubric scores from evidence of actual market success.

21.4 — Creative Reviewer

Each objection should identify:


- Candidate and version.
- Criterion and rubric version.
- Specific defect.
- Rationale or relevant evidence.
- Suggested fix.
- A test for determining whether the fix worked.

Limit revision attempts to two. Preserve the history of revisions and decisions. Never silently approve unresolved work.

21.5 — Memory and diversity


1. Reuse Creative Memory, Idea Metabolism, and Creative Entropy.
2. Distinguish facts, preferences, creative history, synthetic evaluations, and verified real-world outcomes.
3. Reduce repetitive candidates while retaining genuinely distinct ideas.
4. Preserve the source and confidence of memory-derived information.
5. Ensure missing historical data does not become fabricated memory.

Increment21 acceptance criteria


- All five lenses are independently identifiable.
- Candidate identities and histories are preserved.
- Structured critique and revision limits are enforced.
- Provenance survives the complete pipeline.
- Existing endpoints remain compatible.
- The previous test suite passes, and new tests cover the added behavior.
- A fixed benchmark reports diversity and duplication metrics.
- No claim of better creativity is made without measurable evidence.

Deliver "REPORT-INCREMENT21.md", raw logs, changed-file inventory, benchmark results, and a clean archive.

---

PART 5 — INCREMENT22: EVIDENCE AND BROWSER AGENT HARDENING

Goal

Make research useful to the creative pipeline without treating web content as trustworthy instructions or unsupported claims as facts.

22.1 — Browser security


1. Inspect the current Browser Agent before modifying it.
2. Preserve its existing restricted, read-only behavior.
3. Test domain allowlisting, DNS validation, IP pinning, redirects, private and link-local addresses, IPv4 and IPv6 edge cases, response size limits, timeouts, and content-type restrictions.
4. Check for DNS rebinding and other SSRF bypasses.
5. Treat fetched page content as untrusted input.
6. Prevent page content from overriding system instructions or triggering unauthorized tools.
7. Verify that browser failures fail closed.
8. Test snapshot integrity and evidence retrieval.
9. Test the real Chromium execution path in an environment that supports the required browser runtime.
10. Do not introduce Stagehand or a different browser framework unless the current implementation demonstrably cannot satisfy a required use case.

22.2 — Evidence ledger


1. Preserve the source URL, retrieval time, content hash, snapshot identity, and extraction metadata.
2. Distinguish retrieved text from model-generated summaries and interpretations.
3. Track review status explicitly.
4. Never upgrade unreviewed evidence to verified merely because the model used it.
5. Preserve evidence references through revisions and final artifacts.
6. Make missing or invalid evidence visible to downstream components.

22.3 — Claim and risk gate

Implement a claim-review layer that:


- Identifies factual and consequential claims in creative outputs.
- Links claims to relevant evidence references.
- Distinguishes supported, unsupported, contradictory, and unreviewed claims.
- Records the basis for each classification.
- Requires appropriate human review for consequential or high-risk claims.
- Avoids treating semantic similarity alone as proof that a source supports a claim.

Do not label a claim verified solely because a URL exists.

22.4 — Research discovery

Only after the existing Browser Agent is secure and stable, evaluate bounded search and source-discovery capabilities.

Keep research read-only. Do not enable autonomous login, purchasing, publishing, form submission, or other consequential browser actions.

Increment22 acceptance criteria


- Browser security regressions are tested.
- Evidence provenance is preserved end to end.
- Claim status is distinct from source retrieval status.
- Unreviewed evidence cannot silently become verified.
- Browser failures are explicit.
- Real-browser tests are either executed successfully or clearly reported as not run.

Deliver "REPORT-INCREMENT22.md", raw logs, security test results, and a clean archive.

---

PART 6 — INCREMENT23: MODEL GATEWAY AND BUDGET CONTROL

Goal

Centralize model access and cost control without breaking existing provider integrations.

23.1 — Model Gateway


1. Inspect the current provider integration and metrics.
2. Create or complete a single gateway used by all model-calling components.
3. Keep provider-specific request and response handling inside adapters.
4. Preserve the existing Gemini integration if present and working.
5. Add OpenAI and Vertex AI adapters only if their integration is supported by the actual configuration and environment.
6. Make provider and model selection configurable.
7. Validate provider errors, timeouts, retries, rate limits, and malformed responses.
8. Preserve provenance for every real model call.
9. Never silently replace a failed real call with a mock response.

23.2 — Model routing

Create explicit configurable routing policies for:


- Candidate generation.
- Critique and evaluation.
- Final artifact generation.
- Optional lower-cost utility tasks.

Do not hardcode model names throughout the codebase. Make the routing policy inspectable and versioned.

23.3 — Budget reservations


1. Define run-level and call-level budgets.
2. Reserve budget before starting model calls.
3. Ensure concurrent reservations cannot exceed the configured limit.
4. Reconcile estimated and actual usage.
5. Define behavior for failed calls, retries, timeouts, and uncertain usage.
6. Make reservations idempotent.
7. Deny or stop work when the budget is exhausted.
8. Ensure all model calls pass through the same enforcement boundary.

Use the simplest storage mechanism that correctly supports the project's actual deployment model. Do not claim atomic enforcement if it is only an in-memory counter in a multi-process environment.

23.4 — Mock mode

Mock mode must be explicit, visible, and intended for tests or deliberate demonstrations.

Every generated result must be attributable to its provider mode. Mock outputs must never be presented as real model output.

Increment23 acceptance criteria


- No model caller bypasses the gateway.
- Provider failures remain visible.
- Budget enforcement is tested under concurrency.
- Model selection and prompt versions are recorded.
- No unconfigured provider is represented as successfully tested.
- Existing model integrations continue to work.

Deliver "REPORT-INCREMENT23.md", gateway tests, budget tests, raw logs, and a clean archive.

---

PART 7 — INCREMENT24: RELIABLE EXECUTION AND PROVENANCE

Goal

Make runs recoverable, auditable, and resistant to duplicate work.

24.1 — Run lifecycle


1. Define valid Run state transitions.
2. Keep Run state separate from candidate and artifact state.
3. Validate transitions at service boundaries.
4. Make invalid transitions fail explicitly.
5. Preserve stable run IDs and artifact versions.

24.2 — Event log


1. Introduce an append-only event log for important state transitions and decisions.
2. Record actor or component, event type, timestamp, run ID, relevant artifact version, and correlation identifiers.
3. Derive mutable projections from recorded events where appropriate.
4. Make it possible to reconstruct recorded state without regenerating previously saved model outputs.
5. Store references to artifacts instead of duplicating large content unnecessarily.
6. Preserve existing storage behavior where it is adequate.

Do not migrate the entire system to full event sourcing without demonstrated need.

24.3 — Idempotency and recovery


1. Give each significant operation a stable idempotency key.
2. Prevent duplicate execution when clients retry requests.
3. Recover interrupted runs from persisted state.
4. Preserve model outputs already produced.
5. Distinguish retryable errors from permanent failures.
6. Add a transactional outbox only if asynchronous jobs require reliable coordination between database commits and task dispatch.

24.4 — Approval integrity

Bind approvals to the exact artifact hash, artifact version, applicable policy version, and evidence set.

Any relevant content change must invalidate an approval that no longer applies.

Increment24 acceptance criteria


- Run state can be reconstructed from recorded state transitions.
- Duplicate requests do not accidentally duplicate consequential work.
- Interrupted runs recover without silently regenerating existing outputs.
- Artifact provenance is complete.
- Approval invalidation is tested.
- Recovery and persistence limitations are documented.

Deliver "REPORT-INCREMENT24.md", recovery tests, raw logs, and a clean archive.

---

PART 8 — INCREMENT25: SECURITY, PRIVACY, AND GOVERNANCE

Goal

Make the creative system safe to operate with real inputs, credentials, research, and model outputs.


1. Review authentication and authorization at the actual backend boundaries.
2. Validate and limit incoming payloads.
3. Secure secrets and ensure logs do not expose credentials.
4. Review file access, path handling, URL fetching, and external calls.
5. Implement appropriate data retention and deletion controls.
6. Separate untrusted browser content from system instructions.
7. Prevent model output from bypassing backend authorization.
8. Require human approval for consequential external actions.
9. Ensure approvals are tied to the correct artifact and policy versions.
10. Review CORS, security headers, request limits, and error handling.
11. Add negative tests for unauthorized requests and invalid inputs.
12. Review dependency vulnerabilities and update only with regression testing.
13. Document the threat model and remaining risks.

Do not make multi-tenant SaaS architecture a central goal unless the existing product requirements actually require it. Do not add unrelated billing, CRM, or customer-management systems.

Increment25 acceptance criteria

Security controls are enforced server-side, sensitive data is handled appropriately, and known limitations are explicitly documented.

Deliver "REPORT-INCREMENT25.md", security tests, dependency audit results, raw logs, and a clean archive.

---

PART 9 — INCREMENT26: EVALUATION LAB AND CONTROLLED IMPROVEMENT

Goal

Measure creative performance and make improvements based on evidence rather than impressions.

26.1 — Stable benchmark suite


1. Inspect the existing benchmark fixtures and evaluation framework.
2. Build a representative, versioned set of Briefs.
3. Preserve baseline outputs for comparison.
4. Ensure test inputs do not contain unnecessary personal or confidential data.
5. Keep synthetic audience evaluations distinct from real audience feedback.

26.2 — Quality metrics

Measure separately:


- Brief adherence.
- Novelty and diversity.
- Candidate duplication.
- Internal coherence.
- Evidence quality.
- Unsupported claim rate.
- Revision effectiveness.
- Human evaluator agreement.
- Latency and model cost.
- Failure and recovery rates.

Define metric limitations and avoid using one aggregate score to hide regressions.

26.3 — Controlled experiments


1. Compare prompt versions and model-routing policies on comparable inputs.
2. Record model ID, prompt version, rubric version, parameters, and provider mode.
3. Use repeat runs when generation variance matters.
4. Separate changes to prompts from changes to models and scoring rubrics.
5. Record hypotheses and expected outcomes before experiments.
6. Preserve failed experiments and regression results.
7. Require measurable evidence before promoting a change.

Increment26 acceptance criteria


- Benchmarks are repeatable to the extent supported by the models and environment.
- Results distinguish real model calls from fixtures.
- Quality improvements and regressions are measurable.
- No synthetic result is represented as real market validation.

Deliver "REPORT-INCREMENT26.md", benchmark outputs, experiment records, raw logs, and a clean archive.

---

PART 10 — INCREMENT27: FINAL RELEASE CANDIDATE

Goal

Produce a stable, documented, reproducible TextFX Creative Core release.

27.1 — End-to-end verification

Test the complete workflow:

Brief → independent discovery → candidate archive → critique → controlled revision → evidence and claim review → final creative artifact → approval and provenance.

Also test:


- Invalid inputs.
- Missing provider credentials.
- Provider outages.
- Budget exhaustion.
- Browser denial and timeout.
- Invalid or tampered evidence.
- Duplicate requests.
- Interrupted runs and recovery.
- Invalid approvals.
- Repeated runs and regression behavior.

27.2 — Compatibility


1. Inventory the actual existing endpoints.
2. Test their methods, paths, expected inputs, outputs, and error behavior.
3. Preserve backward compatibility unless a documented migration is necessary.
4. Test frontend integration with the actual backend.
5. Verify environment configuration and startup instructions.

27.3 — Reproducible build


1. Install dependencies from lockfiles in a clean environment.
2. Run backend typecheck and build.
3. Run frontend typecheck and production build.
4. Run the complete automated test suite.
5. Run security and integration tests.
6. Verify the production startup process.
7. Test any supported packaging targets in their required operating systems.
8. Do not claim Windows installer or executable support without a successful build and test on a suitable Windows environment.

27.4 — Documentation

The final documentation must distinguish:


- Implemented and verified capabilities.
- Implemented but incompletely tested capabilities.
- Planned capabilities.
- Known limitations.
- Required environment variables.
- Real provider setup.
- Mock/test mode.
- Build, test, startup, backup, and recovery procedures.

Do not document proposed architecture as implemented functionality.

Increment27 acceptance criteria

The project builds from a clean checkout, the full applicable test suite passes, the end-to-end workflow works in the available real environment, known external dependencies are documented, and the release can be reproduced.

Deliver the final release archive, final report, test logs, endpoint inventory, known-limitations list, and release notes.

---

PART 11 — REQUIRED DELIVERABLES FOR EVERY INCREMENT

For every increment from 21 through 27, produce:


1. A clean, independently identifiable project archive.
2. A report named "REPORT-INCREMENTXX.md".
3. Raw build and test logs.
4. A list of files added, changed, and removed.
5. A baseline-versus-final test summary.
6. Actual commands and exit codes.
7. An explicit list of tests not run and the reason.
8. A list of remaining risks and limitations.
9. Confirmation that the previous baseline remains recoverable.
10. A clear statement of whether the increment acceptance criteria were met.

Do not include "node_modules" or generated "dist" directories unless a specific release requirement calls for them. Ensure all required source files, lockfiles, tests, and documentation are included.

Verify the actual archive contents after creating it. Do not merely print a filename and claim that the archive exists.

---

PART 12 — FINAL EXECUTION DIRECTIVE

Start with the actual Increment20 archive.

Inspect it, establish the baseline, and begin Increment21.

Continue through Increment22, Increment23, Increment24, Increment25, Increment26, and Increment27 in sequence.

After each increment:


- Verify the acceptance criteria.
- Preserve a clean checkpoint.
- Update the roadmap with actual status.
- Continue automatically if the criteria pass.

If an increment fails its acceptance criteria, fix the failure and rerun the relevant tests before moving forward. If a blocker cannot be resolved safely, document the exact blocker and continue with independent tasks only when doing so cannot compromise the blocked dependency.

Do not stop after generating reports or implementation plans. Implement and verify the actual code.

Do not claim completion based on code inspection alone when execution is required.

Do not fabricate logs, test results, artifacts, benchmark improvements, or successful provider calls.

Do not weaken tests to make the build pass.

Do not delete existing working features to simplify implementation.

Do not create unnecessary increments, rename components solely for appearance, or repeatedly restructure working code.

The goal is one coherent, maintainable, secure, evidence-aware creative intelligence system—not the largest possible codebase.

At the end, deliver a final summary stating:


1. What is implemented.
2. What was actually tested.
3. What passed and failed.
4. What remains unverified.
5. How to run the system.
6. Where the final archive and raw logs are located.

Begin now by locating and inspecting the exact Increment20 archive. Do not ask what to do next after each increment; this roadmap is the execution plan.