# TextFX Creative Core — Increment 15

## Scope

Increment 15 adds an **evidence-gated policy review dossier**. It combines three existing outputs:

- Creative Quality Lab paired version comparison;
- inter-rater agreement diagnostics;
- finalized blind ratings that record a successful experiment integrity verification.

It does not tune prompts, modify weights, change a creative strategy, or update generation policy.

## Run

```bash
npm run policy:review -- \
  --quality quality-report.json \
  --agreement agreement-report.json \
  --ratings finalized-ratings.json \
  --out policy-dossier.json
```

Optional thresholds include `--min-paired-cases 5`, `--min-reviewers 3`, `--min-weighted-agreement 0.6`, and `--max-disagreement-alerts 5`.

## Evidence gates

1. Experiment integrity must be marked verified by the finalize step using the packet, mapping, and benchmark manifest.
2. Enough complete paired cases must exist.
3. Complete artifact summaries must meet the reviewer-count threshold.
4. Linearly weighted reviewer agreement must meet the configured minimum.
5. Disagreement alerts must be few enough to warrant review; otherwise they remain a blocking concern.
6. A paired score delta must be available.

The output records every gate and its observed value. Failed gates produce `insufficient_evidence`. If all gates pass, the only positive recommendation is `eligible_for_human_review_of_a_controlled_trial`.

## Hard safety boundary

`automaticPolicyChange` is always `false`. Passing the gates does not establish causality or audience impact and does not authorize changing generation behavior. A human must review the dossier, document a decision, define rollback criteria, and separately approve any controlled trial.

## Verification performed

- `node --test backend/tests/*.test.cjs`: **31/31 passed**.
- CLI integration: prepared a paired blind packet for all five benchmark cases, finalized 30 mock ratings after manifest verification, generated quality and agreement reports, and produced a policy dossier. Synthetic data passed the configured gates; this validates the tooling only and is not evidence that one TextFX version is creatively better.
- Full TypeScript rebuild remains unverified because repository dependencies/type definitions have not been installed in this environment.
