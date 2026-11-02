# TextFX Creative Core — Increment 3: Creative Court

## Purpose
Increment 3 adds a distinct judgment stage between multi-lens discovery and script generation. Discovery still generates candidate concepts; the Court evaluates those candidates against the user brief and strategic insight, then selects which concept proceeds.

## Evaluation rubric
The model is instructed to score each candidate using the same weighted criteria:
- Goal and brief fit — 25%
- Insight depth — 20%
- Originality and non-obviousness — 20%
- Emotional and strategic coherence — 15%
- Execution clarity — 10%
- Risk and ethical awareness — 10%

The Court records a 0–100 score, `advance` / `revise` / `reject` verdict, rationale, strengths, weaknesses, and next actions for every candidate. The returned structure is validated for candidate identity, completeness, score range, and language consistency.

## Reliability behavior
If the model call fails or returns malformed output, the run continues with the existing discovery heuristic. The decision is explicitly marked `heuristic-fallback`, and the fallback explanation is recorded in the audit trace. This is not represented as an independent model judgment.

## Data and trace
- Added `backend/src/modules/creative-court.ts`.
- Added the `court` phase to the agent trace.
- Added the Court decision to `CreativeIR` (`source`, `selectedCandidateId`, `reviews`, `summary`, `rubric`).
- The selected candidate ID in `CreativeIR.discovery` now matches the candidate actually passed to Script Writer.
- Existing API response fields are preserved.

## Cost and limitations
The Court makes one additional model call per run, independent of the three candidate-generation calls. Its scores are model judgments, not objective truth or validated audience research. Human review remains important for high-impact creative decisions. The separate end-of-run `buildEvaluation` is still a structural heuristic in this increment; replacing it with a full-output evaluator is a subsequent improvement.

## Validation status
Archive integrity can be checked independently. A complete TypeScript build has not been confirmed in this environment because the project dependencies are not installed in the extracted source tree. Do not treat this increment as build-verified until `npm install` and `npm run build` succeed.
