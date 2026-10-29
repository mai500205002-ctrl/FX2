# Creative Core tests

- `npm test`: compile `src/` then run all tests.
- `npm run test:unit`: run against existing `dist/` output; useful for quick checks but not a substitute for rebuilding after source changes.
- `creative-core.test.cjs`: unit/regression contracts for memory and counterfactual evidence.
- `agent-pipeline.test.cjs`: mocked end-to-end orchestration tests; its fake provider throws if any live generation call is attempted.
- `fixtures/creative-regression-cases.json`: software invariants.
- `fixtures/creative-benchmark.json`: stable prompts and a proposed blind human-scoring protocol, not automatic artistic ground truth.

Test results do not prove artistic quality, originality, or audience impact. The benchmark requires real outputs and blinded human scoring.
- `creative-quality-lab.test.cjs`: weighted blind-rating aggregation, reviewer completeness, input validation, and paired version comparison.
- `fixtures/creative-quality-ratings.template.json`: empty template for blind human ratings.
- `npm run test:quality`: run only the Quality Lab tests against the current compiled output.
- `npm run quality:report -- --ratings <file> --baseline <version> --candidate <version> [--out <file>]`: aggregate a human-rated benchmark and emit a JSON report.
- `creative-experiment-orchestrator.test.cjs`: paired blind-packet preparation, private version mapping, and post-scoring finalization safeguards.
- `fixtures/creative-experiment-artifacts.template.json`: example input for controlled version experiments. Replace example text with final artifacts for matching case IDs across versions.
- `node scripts/creative-experiment-orchestrator.cjs prepare --artifacts <file> --packet-out <file> --mapping-out <private-file>`: create randomized blind packet and separate confidential mapping.
- `node scripts/creative-experiment-orchestrator.cjs finalize --ratings <blind-ratings.json> --mapping <private-file> --out <finalized-ratings.json>`: apply version labels only after blind ratings are finalized.


## Inter-rater agreement

Run `node --test tests/creative-inter-rater-agreement.test.cjs`. The report uses descriptive pairwise exact and linear-weighted agreement, highlights missing criterion scores and large score spreads, and explicitly does not claim chance-corrected reliability.


## Evidence-gated policy review

Run `node --test tests/creative-policy-review.test.cjs`. These tests ensure evidence gates are explicit and that passing them never enables automatic policy changes.


## Human trial governance

Run `node --test tests/creative-trial-governance.test.cjs`. Approval is blocked when gates fail and the append-only hash chain is verified for tampering.


## Provenance audit

Run `node --test tests/creative-provenance-audit.test.cjs` alongside the orchestrator tests. Provenance is private during blind scoring and must not contain secrets.


## Repeated-run stability

Run `node --test tests/creative-run-stability.test.cjs`. This analyzer requires independent repeated outputs and reports within-version variance without making causal claims.
