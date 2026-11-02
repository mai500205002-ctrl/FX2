# TextFX Creative Core — Increment 7

## Creative Entropy Thermostat + Anti-Taste Memory

This increment adds a bounded diversity-control stage between idea metabolism and Creative Court.

### What it does

- Measures pairwise lexical Jaccard similarity across the current candidate pool.
- Records a diversity diagnostic, the most similar pair, the trigger threshold, and the action in `CreativeIR.discovery.entropy`.
- If maximum similarity reaches the configured threshold (default `0.68`), asks the existing concept generator for one targeted regeneration of the lower heuristic-scored member of that pair.
- Accepts the replacement only if the measured maximum pairwise similarity decreases. Otherwise, it retains the original candidate pool.
- Passes up to four relevant `avoid` lessons from Creative Memory as anti-taste guidance. These are contextual prompts, not universal bans.
- Limits the stage to one regeneration attempt per run; original candidates are never removed merely because they are similar.
- Emits audit events so the result is inspectable.

### Important limits

- Token overlap is only a diagnostic proxy. It cannot reliably detect semantic similarity, artistic quality, or strategic value.
- A higher diversity score is not automatically better creative work.
- Anti-taste memory is still process-local in this increment, and its lessons are generated from model-based reviews, not real-world audience outcomes.
- No full TypeScript build is claimed unless dependencies are installed and the build is run successfully.
