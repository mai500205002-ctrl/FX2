# TextFX Creative Core — Increment 6: Idea Metabolism Engine

## Purpose

Increment 6 turns the discovery pool into a bounded evolutionary pool before the Creative Court chooses a concept. It preserves the original multi-lens seed candidates and attempts two child operations:

- **Mutation:** one child derived from the strongest heuristic seed, instructed to preserve its strategic core while changing the creative mechanism, emotional turn, or visual execution.
- **Crossover:** one child derived from the two strongest heuristic seeds, instructed to integrate their non-overlapping mechanisms into one coherent concept.

The existing concept mapper remains the generator. The metabolism layer does not silently replace the seed pool, and generation failures are isolated; any successful seeds remain available for judgment.

## Lineage and scoring

Each candidate now carries optional `origin`, `parentIds`, and `generation` metadata. Seed candidates are generation 0. Metabolic offspring record their parent IDs and generation. The offspring heuristic score blends the parent score with a novel-token ratio; this score is only a fallback/triage signal, not an objective creativity metric. The Creative Court receives the expanded pool and remains responsible for independent concept judgment.

## Trace and CreativeIR

CreativeIR records the expanded candidate pool, offspring IDs, metabolism events, and lineage events. The agent trace reports seed count, successful offspring count, total candidate count, and skipped operations. The capability list now includes `idea-metabolism`.

## Cost and limits

The engine attempts at most two additional concept-generation calls per run. This is deliberately bounded to prevent uncontrolled branching and runaway cost. Failed mutation/crossover attempts do not discard seeds. If the Court provider fails, its existing explicitly labelled heuristic fallback still applies.

## Known limitations

- Build verification is pending until the backend dependencies and Node.js type definitions are installed in a suitable environment.
- Creative memory remains process-local as documented in Increment 5.
- Novel-token ratio is a crude linguistic heuristic; it does not prove novelty, usefulness, or audience impact.
- No audience outcome or human approval is inferred from model-generated scores.
