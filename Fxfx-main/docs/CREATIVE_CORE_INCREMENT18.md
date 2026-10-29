# TextFX Creative Core — Increment 18

## Scope

Increment 18 analyzes repeatability when several independent outputs exist for the same benchmark case and engine version. It uses the Quality Lab's validated human ratings, then summarizes the distribution of scores across outputs rather than assuming one output represents an entire release.

## Input and command

Combine finalized rating arrays from multiple independent experiments into one JSON array (or an object with a `ratings` array). Keep every artifact ID unique and retain its true engine version and reviewer scores.

```bash
npm run stability:report -- \
  --ratings combined-finalized-ratings.json \
  --baseline v1 \
  --candidate v2 \
  --out stability-report.json \
  --min-repeats 3
```

The default minimum is three complete independent outputs per benchmark case and version. A case is excluded from paired comparison if either version lacks the required repeats.

## Report contents

- Complete repeat count per case/version;
- mean weighted score, sample standard deviation, minimum, maximum, and range;
- per-criterion variability across outputs;
- paired baseline/candidate means and deltas for eligible cases;
- explicit warnings for insufficient repeat coverage.

## Interpretation limits

- Repeated outputs must be independent generations; duplicating an artifact does not create a replicate.
- The repeat threshold is a workflow guardrail, not a statistical power guarantee.
- Variability is part of creative behavior; lower variance is not always better if it comes at the expense of diversity.
- No generation policy changes automatically based on this report.

## Verification performed

- `node --test backend/tests/*.test.cjs`: **47/47 passed**.
- CLI integration: generated mock ratings for 30 distinct artifacts across five cases, three runs per version, and three reviewers per artifact; the analyzer reported all five paired cases eligible.
- This validates the analysis tooling only. It does not demonstrate that any actual TextFX version is better. Full TypeScript build remains unverified in a dependency-complete environment.
