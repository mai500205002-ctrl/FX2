# FX2 Implementation Roadmap — Controlled Backend Completion

Date: 2026-11-27  
Reviewed baseline: main at 8e7771ef49d8ea0af94b9594488f9b9fe619ce6d  
Controlling authority: repository-root MASTER_ENGINEERING_ROADMAP.md

## 1. Scope decision

The controlling roadmap governs current execution. Active scope is the existing TextFX Creative Core backend, single-user operation, incremental repair and verification.

Explicitly deferred until backend acceptance and separate authorization:
- Frontend product changes/redesign and live control-room UI.
- Electron runtime/packaging, Android/mobile and other clients.
- SaaS, multi-tenancy, customer management, billing and subscriptions.
- New databases, frameworks, deployment platforms or distributed architecture unless a demonstrated backend requirement justifies one.

The research files describe valuable future creative-intelligence improvements. They are retained below as a deferred backlog, not silently promoted into the active backend completion scope.

## 2. Current execution status

| Work item | Status | Evidence |
|---|---|---|
| BE-00 repository identity and static baseline | Partial | main HEAD and project directory identified; runtime/test baseline not re-executed |
| BE-01 backend architecture map | Partial | Static map created from inspected source |
| BE-02 gap/coverage/risk baselines | Partial | Gap matrix and historical test evidence documented; coverage/risk artifacts being established |
| BE-03 onward | Not started in this session | Must be selected from controlling roadmap after BE-00/01/02 gates |

No source code was modified. No paid provider call was made. No deployment or release action was performed. The current review did not execute a local build or test suite.

## 3. Mandatory execution order

Follow the 15 phases and BE-00 through BE-18 defined in MASTER_ENGINEERING_ROADMAP.md. Do not invent a parallel roadmap or skip gates.

### Immediate next work: BE-00, BE-01 and BE-02

1. BE-00 — Freeze repository identity, branch, exact HEAD, worktree state, manifests, lockfiles, runtime and reproducible baseline logs.
2. BE-01 — Complete backend request-to-response architecture tracing: routes, middleware, services, provider gateway, persistence, lifecycle, evidence, approval and CreativeIR.
3. BE-02 — Complete capability gap matrix, requirement-to-test coverage matrix, dependency/defect/risk register, API inventory and smallest evidence-backed increment proposal.

The static documents in this branch are preliminary artifacts. They do not satisfy the execution portions of BE-00 because tests, typechecks, builds and fresh audits have not been run.

### After BE-00/01/02

Choose the smallest next increment from the controlling roadmap. Candidate areas include configuration/API integrity, authentication/authorization, CreativeIR contracts, discovery, Court/Reviewer, memory/evolution, Browser Agent/evidence, provider gateway/budgets, run lifecycle/approval, and final verification. The exact next increment must be selected from evidence, not assumed in advance.

## 4. Future creative-intelligence research backlog — deferred

These ideas are supported by the supplied expert reports, but they are not current implementation authorization. Revisit only after the backend baseline and controlling acceptance gates permit it.

### A. Strategic divergence and mechanism-level diversity
- Compile several genuinely different strategic territories before concept wording.
- Add a versioned Idea DNA / Mechanism Ledger: human tension, strategic angle, core mechanism, audience behavior, emotional turn, visual device, narrative structure, territory and parent lineage.
- Combine lexical diagnostics, Arabic semantic similarity and structured mechanism comparison.
- Consider a bounded Quality-Diversity archive only after descriptors and human quality labels are reliable.

### B. Human-calibrated Creative Court
- Reuse the current Court and blind-evaluation tools.
- Build a 40–60 artifact Egyptian/Arabic golden set with independent practitioner ratings.
- Add pairwise comparison and report disagreement, false accepts and false rejects.
- Change weights only through a new rubric version and a controlled rerun.

### C. Egyptian language and cultural quality
- Build a 200–300 short-ad gold set reviewed by Egyptian practitioners.
- Use dialect classifiers as advisory signals with abstention.
- Distinguish dialect identification from naturalness, pragmatics, idiom, cultural suitability and advertising quality.
- Gate outcomes: PASS, REVISE or HUMAN_REVIEW.

### D. Brand Memory
- Add a separate, versioned and human-approved BrandProfile.
- Keep Brand Memory distinct from procedural Creative Memory.
- Preserve source, confidence and approval for product facts and claims.

### E. Real campaign outcomes
- The supplied research found no verified open Egyptian/Arabic dataset with real CTR/conversion/sales outcomes.
- Build a validated import schema only when authorized.
- Keep AI_PREDICTED, HUMAN_RATED and REAL_CAMPAIGN_RESULT separate.
- Never claim market learning without attributable campaign observations.

### F. Bounded evolution and Pre-Mortem
- Preserve immutable parent concepts and rejected candidates.
- Change one dimension at a time; retain best-so-far.
- Cap at three rounds or stop earlier when external quality is flat or diversity degrades.
- Use Pre-Mortem as risk discovery, not an automatic idea-killing judge.

## 5. Engineering acceptance rules

- Preserve existing APIs unless a documented, tested migration is necessary.
- Reuse existing modules; no replacement framework or large agent swarm.
- Separate deterministic validation from LLM judgment.
- No silent mock substitution.
- No paid LLM/API operation without prior user approval and a cost/risk statement.
- No destructive data operation, public deployment or irreversible security decision without explicit approval.
- No source edits, commits, pushes or deployments unless the user authorizes the specific action.
- Record exact commands, exit codes, test counts and limitations.
- Mark unavailable checks NOT RUN with a reason.
- Keep changes minimal, reversible and tied to an acceptance criterion.

## 6. Session handoff fields

At each checkpoint record repository, branch, HEAD, active BE increment, last verified increment, files inspected/changed, tests executed, defects/blockers, next exact task and any required approval.
