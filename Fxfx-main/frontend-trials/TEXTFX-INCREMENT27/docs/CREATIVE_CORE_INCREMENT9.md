# TextFX Creative Core — Increment 9

## Durable Creative Memory + Controlled Evaluation Ledger

### What changed

- Replaced process-local-only creative lessons with a small, versioned JSON state file. The default path is `data/creative-memory.json` relative to the backend working directory; `TEXTFX_CREATIVE_MEMORY_PATH` can override it.
- Persists only bounded creative lessons and bounded counterfactual evidence—not full briefs, generated scripts, or customer records.
- Writes state through a temporary file followed by rename, and uses restrictive file permissions where supported.
- Loads up to 160 lessons and retains at most 200 counterfactual observations. The public status reports durability and a sanitized diagnostic without exposing the absolute state-file path.
- Preserves an unreadable or unsupported state file rather than silently overwriting it. The status reports `volatile` and a diagnostic if persistence cannot be established.
- Adds an observe-only evaluation ledger for model-to-model counterfactual reviews: sample count, shadow score wins/losses/ties, and mean score delta.
- Counterfactual evidence is recorded for audit, but it does not change concept selection, generation settings, or learning policy automatically. A single model score is not causal evidence.

### Boundaries and caveats

- This is local file persistence for a single backend instance, not a concurrent multi-process database. Do not point multiple writers at the same file without adding locking or a transactional store.
- Aggregate score differences remain reviewer judgments, not measured audience outcomes.
- The state file contains generated lesson text derived from review feedback. Operators should protect the backend data directory and configure a suitable path for their environment.
- Full TypeScript build and end-to-end runtime validation remain pending until dependencies are installed and the backend build succeeds.
