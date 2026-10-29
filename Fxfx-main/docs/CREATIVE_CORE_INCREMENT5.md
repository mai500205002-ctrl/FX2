# TextFX Creative Core — Increment 5: Creative Memory & Evolution Signals

## Purpose

Give TextFX a bounded learning loop across runs in the same live backend process. The system can retrieve a few relevant lessons from earlier model-based script reviews and use them as guidance for new concept discovery and script generation.

## Added

- `backend/src/modules/creative-memory.ts`: bounded lesson memory with relevance ranking, duplicate suppression, and explicit `reinforce` / `avoid` polarity.
- Retrieval is limited to up to five relevant lessons per run; the module caps memory at 160 lessons.
- Lessons are learned only from a model-based Creative Reviewer result. Structural fallback scores are not treated as evidence of creative quality.
- Lessons contain short review observations, source run ID, source score, timestamp, and matching tags—not full prior briefs or scripts.
- Retrieved lesson IDs, learned lesson IDs, and memory status are included in `CreativeIR`, the response record, the audit trace, and lineage.
- Discovery and script generation receive a caution to apply relevant lessons without copying earlier concepts or treating them as universal rules.

## Data flow

1. Generate the current brief's insight.
2. Retrieve up to five relevant prior lessons.
3. Add the lessons as contextual guidance for discovery, concept judging, and script writing.
4. Run the existing independent script review and at most one targeted revision.
5. Learn a small set of lessons from the final review only when its source is the model.
6. Record learning provenance in `CreativeIR` and the audit trace.

## Deliberate limits

- Memory is **process-local** and is lost when the backend process restarts. This increment does not claim durable cross-restart learning.
- Similarity matching is lightweight token overlap, not semantic embeddings.
- Review feedback can be imperfect; lessons are guidance, not hard constraints, and the prompt explicitly warns against overgeneralization.
- This does not claim learning from real audience outcomes. Audience evidence and causal/counterfactual learning remain future work.
- Full TypeScript build is not verified in this environment because project dependencies are not installed. Install from the backend lockfile and run the backend build before treating this increment as production-ready.
