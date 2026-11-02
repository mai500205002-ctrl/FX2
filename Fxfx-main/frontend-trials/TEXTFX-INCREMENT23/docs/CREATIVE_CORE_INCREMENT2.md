# TextFX Creative Core — Increment 2

## What changed

This increment adds a multi-lens discovery stage to the existing Insight → Concept → Script flow. It does not replace the current generators or introduce a separate service.

### Discovery lenses

- **Human Truth** — searches for an emotionally honest human contradiction.
- **System Reversal** — reverses an accepted category assumption for a strategic purpose.
- **Unexpected Analogy** — transfers a mechanism from a distant domain into a creative device.

Each lens invokes the existing concept mapper with a distinct target/problem instruction. Successful candidates are retained in `CreativeIR.discovery`; the highest-ranked candidate becomes the selected concept and feeds the existing script writer. Partial generation failure is tolerated as long as at least one candidate succeeds. If every lens fails, the run fails explicitly.

## Ranking model

Candidates are ranked with inspectable heuristics: keyword overlap with the insight (45%), relative distinctiveness against other generated candidates (35%), and required-field completeness (20%). The score is a prioritization heuristic, not an objective measure of creative quality. The selected candidate's rationale is stored with it.

## Traceability

The run trace records the discovery start and the candidate IDs, lens names, scores, and selected lens. `CreativeIR.lineage.events` now includes candidate generation, ranking, and selection. The status capability list advertises multi-lens discovery and concept ranking.

## Cost and behavior

The default discovery stage makes up to three concept-generation calls in parallel instead of one. This intentionally increases generation cost in exchange for candidate diversity. Candidate count is clamped to 2–3. A later increment should add a real per-run compute budget before expanding to more candidates or adding independent critic calls.

## Validation status

Static TypeScript validation was attempted, but dependencies and Node type declarations are not installed in this extracted workspace. The compiler output therefore contains missing-module/environment errors. No successful full build or runtime test is claimed.
