# Creative Core Increment 8 — Counterfactual Replay

## What changed

- Added a bounded shadow replay after the primary script's review/revision path is complete.
- Selects at most one runner-up concept, preferring Creative Court scores and falling back to discovery scores only when needed.
- Generates one shadow script and runs one independent review against the same goal, brief, and insight.
- Stores primary/shadow scores, verdicts, score delta, status, interpretation, and explicit limitations in `CreativeIR.counterfactual`.
- Emits audit events and a lineage event for the replay outcome.
- Shadow failures are non-fatal; they do not alter the selected concept, final script, final review, or learning signal.
- Structural fallback reviews are marked inconclusive rather than treated as valid semantic comparisons.

## Boundaries

- Maximum added work per run: one shadow script generation and one shadow review.
- No audience test, causal claim, or claim of general superiority is inferred from a single model comparison.
- The shadow script does not receive a revision pass, so this is a bounded comparison of first-pass alternatives against the primary delivered script, which may have been revised.
- The primary run remains authoritative; shadow results are retained as evidence for future evaluation only.

## Verification status

The source and archive are checked for structural consistency and ZIP integrity. A complete TypeScript build is not claimed unless `npm run build` succeeds with the backend dependencies installed.
