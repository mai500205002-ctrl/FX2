# TextFX Creative Core — Cumulative Roadmap

This roadmap tracks the creative-system increments and their current limits. It does not claim build or runtime verification where those checks have not succeeded.

1. **CreativeIR** — canonical typed representation for one creative run.
2. **Multi-lens Discovery** — Human Truth, System Reversal, Unexpected Analogy.
3. **Creative Court** — independent model-based comparison of concept candidates, with labelled fallback.
4. **Creative Reviewer** — model-based script review and one targeted revision attempt.
5. **Creative Memory** — bounded, process-local lessons derived from model-based reviews.
6. **Idea Metabolism** — bounded mutation/crossover and candidate lineage.
7. **Entropy Thermostat + Anti-Taste Memory** — overlap diagnostics, one bounded diversification attempt, and contextual use of avoid-lessons.
8. **Counterfactual Replay** — one bounded runner-up shadow script and independent review, recorded without changing the primary output.
9. **Durable Creative Memory + Evaluation Ledger** — versioned local persistence for bounded lessons and an observe-only ledger of counterfactual comparisons.
10. **Regression safety net** — deterministic unit tests and a regression-case manifest.
11. **Mocked end-to-end pipeline + human-scored benchmark** — dependency-injected orchestration tests and stable benchmark briefs with blind scoring guidance.

## Current limitations

- Creative Memory now persists to a versioned local JSON file by default; deployments using multiple backend processes need a transactional store or explicit file locking before sharing the same path.
- Lexical similarity is only a proxy; it cannot establish semantic originality or audience impact.
- Learned lessons are generated from model-based review, not controlled audience experiments.
- Full TypeScript build remains unverified until dependencies are installed and `npm run build` succeeds.
- The mocked end-to-end tests validate orchestration contracts only; live-provider integration and creative quality remain unverified.
- Next: run the full build in a dependency-complete environment, then score repeated benchmark outputs blindly with human reviewers before considering any automatic policy adaptation.

## Increment 10 — Regression safety net

- Deterministic Node test suite for core orchestration contracts and durable memory.
- Regression case manifest separates software invariants from subjective creative-quality claims.
- `npm test` rebuilds TypeScript before testing; `npm run test:unit` is for existing compiled output only.
- Next: mocked end-to-end agent orchestration tests and a curated, versioned creative benchmark with blinded human scoring.

12. **Creative Quality Lab** — deterministic aggregation of blind human ratings, completeness checks, and paired version comparisons. Reports remain descriptive and do not alter generation policy.

## Increment 12 status

- Added weighted scoring from the benchmark's declared criteria and a three-independent-reviewer completeness threshold.
- Added paired case comparisons with score deltas, win/loss/tie counts, and explicit limitations.
- Added CLI report generation and unit tests for invalid/incomplete evidence.
- Verified the existing compiled JavaScript suite: 15/15 tests pass. Full TypeScript build remains pending in a dependency-complete environment.
- Next: collect blind ratings for actual TextFX outputs across multiple versions; inspect inter-rater agreement and failure cases before drawing any quality conclusions.

## Increment 13 — Creative Experiment Orchestrator

Implemented paired blind review packet preparation, randomized ordering, separate private version mapping, and post-rating unblinding. Next: add inter-rater agreement diagnostics and an experiment manifest that records protocol/configuration hashes, while keeping all policy changes human-approved and evidence-gated.


## Increment 14 — Inter-rater agreement and experiment integrity

- Added descriptive pairwise exact agreement and linear-weighted agreement by artifact and criterion.
- Flags missing scores and large reviewer spreads for human discussion; original ratings remain unchanged.
- Added an experiment manifest with hashes for the benchmark, scoring protocol, blind packet, private mapping, and individual artifact text.
- The finalize command can verify packet/mapping integrity before applying version labels (`--packet` and `--manifest`).
- Agreement statistics are descriptive, not chance-corrected reliability coefficients, and do not drive automatic policy changes.
- Full TypeScript build still requires a dependency-complete environment; these additions are Node.js CJS scripts and tests.

## Next increment

15. **Evidence-gated policy review** — produce a human-readable decision dossier from benchmark deltas, reviewer agreement, sample sizes, and integrity status. This dossier must be advisory-only: explicit human approval is required before any generation strategy changes.

## Increment 15 — Evidence-gated policy review

- Added a policy-review dossier that combines paired quality deltas, reviewer agreement, disagreement alerts, reviewer coverage, and finalized experiment integrity status.
- Every gate is visible in the report. Passing all gates permits human consideration of a controlled trial only; it never changes generation strategy automatically.
- Added tests for successful evidence review, integrity failure, insufficient coverage, low agreement, disagreement alerts, and invalid inputs.

## Increment 16 — Human trial governance and rollback ledger

- Added a hash-chained decision ledger for explicit approve/reject/defer decisions on policy-review dossiers.
- Approval requires all evidence gates to pass, a human approver, a substantive rationale, a bounded trial window, and at least two rollback/stop criteria.
- Failed evidence can be recorded as reject/defer but cannot be approved. Ledger verification detects altered records and broken chain links.
- This records human authorization only; no generation policy is changed by the script.

## Increment 17 — Creative run provenance

- Added an allowlisted provenance schema for provider/model identifiers, prompt-template and generation-config SHA-256 hashes, source revision, temperature, top-p, and seed.
- Provenance stays out of the blind reviewer packet, is kept in the private mapping, and is hash-committed in the experiment manifest. Finalized ratings retain it for audit.
- Added a provenance audit comparing baseline/candidate configuration fields and identifying missing or differing settings instead of assuming the comparison is controlled.
- Unknown metadata fields are rejected to avoid accidentally storing secrets.

## Increment 18 — Repeated-run stability analysis

- Added an analyzer for combined finalized ratings across independent repeated outputs of the same benchmark case and engine version.
- Computes within-version mean, sample standard deviation, range, criterion-level spread, and paired candidate/baseline means.
- Excludes case comparisons that do not meet the configured minimum repeat count; it does not treat missing repeats as stability.
- Reports are descriptive and never change generation policy automatically.
