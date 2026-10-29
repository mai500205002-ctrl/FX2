# Increment 12 — Creative Quality Lab

## Purpose

Increment 11 supplied stable benchmark briefs and a blind-human-review protocol. Increment 12 turns collected human ratings into reproducible summaries so TextFX versions can be compared against the same cases.

## Added

- `backend/src/modules/creative-quality-lab.ts`: benchmark validation, weighted artifact aggregation, reviewer completeness checks, and paired version comparison.
- `backend/tests/creative-quality-lab.test.cjs`: deterministic tests for scoring and comparison boundaries.
- `backend/scripts/score-creative-benchmark.cjs`: JSON report CLI.
- `backend/tests/fixtures/creative-quality-ratings.template.json`: starting template for ratings input.

## Rating contract

Each rating has `caseId`, `artifactId`, `engineVersion`, `reviewerId`, and a `scores` object. Criterion IDs must match `creative-benchmark.json`; each score must be between 1 and 5. A reviewer may score a given artifact only once. The default completeness threshold is three independent reviewers per artifact, matching the benchmark protocol. Criterion means are weighted using the benchmark's declared weights.

Keep artifact IDs random during scoring and do not expose the engine-version mapping to reviewers. Randomize artifact order before the review session; reveal the mapping only after scores are finalized.

## Run it

From `backend/` after the backend has been built:

```bash
npm run test:quality
node scripts/score-creative-benchmark.cjs --ratings tests/fixtures/my-ratings.json --baseline v1 --candidate v2 --out quality-report.json
```

Input may be a JSON array or an object containing a `ratings` array. Use the exact case IDs from `tests/fixtures/creative-benchmark.json`. The report contains per-artifact summaries and paired case-level comparisons. It exits with a nonzero status if no complete paired cases exist, because there is no version comparison to interpret.

## Interpretation guardrails

- A report is descriptive evidence, not a statistical significance test.
- A small or incomplete benchmark cannot establish general improvement.
- Human ratings remain subjective; measure inter-rater agreement separately when feasible.
- Benchmark score changes do not prove audience or business impact.
- No automatic generation or selection policy is modified by this module.
- Existing model self-reviews are not substituted for independent human ratings.

## Verification status

The current compiled JavaScript test suite passes 15/15 tests. The new TypeScript source was added, but the full TypeScript build still needs to be run in an environment with backend dependencies and Node type definitions installed. `test:quality` targets the existing compiled output and is not a replacement for the full build.
