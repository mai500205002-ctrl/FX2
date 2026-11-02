# Increment 13 — Creative Experiment Orchestrator

## Purpose

Prepare reproducible, paired, blind human-evaluation packets for comparing TextFX engine versions on the same benchmark cases. The orchestrator is an evaluation utility; it does not call an LLM, modify generation behavior, or infer that one version is artistically superior by itself.

## Two-phase workflow

### 1. Prepare the blind packet

From `backend/`, create `artifacts.json` using the schema in `tests/fixtures/creative-experiment-artifacts.template.json`. Include one final artifact for every case/version pair being compared. Every engine version must cover exactly the same case IDs. Remove version/model names, timestamps, or other clues from the artifact text before preparing the experiment.

```bash
node scripts/creative-experiment-orchestrator.cjs prepare \
  --artifacts artifacts.json \
  --packet-out out/blind-packet.json \
  --mapping-out private/version-mapping.json \
  --experiment-id exp-2026-01
```

Share only `blind-packet.json` with reviewers. It contains randomized artifact order, random blind IDs, the exact benchmark brief, and the scoring criteria. Do **not** share the private mapping file. The CLI attempts to restrict generated files to owner-only permissions (`0600`); permissions depend on the operating system and filesystem.

### 2. Collect ratings and finalize

Reviewers submit JSON shaped like this; the version field is intentionally absent:

```json
[
  {
    "reviewerId": "reviewer-01",
    "artifactId": "blind-...",
    "scores": {
      "brief_alignment": 4,
      "originality": 5,
      "emotional_coherence": 4,
      "visual_executability": 3,
      "clarity_and_pacing": 4
    }
  }
]
```

After all reviewers have finalized their ratings, apply the hidden mapping:

```bash
node scripts/creative-experiment-orchestrator.cjs finalize \
  --ratings out/blind-ratings.json \
  --mapping private/version-mapping.json \
  --out out/finalized-ratings.json
```

Then feed the finalized file into the existing Quality Lab report command:

```bash
npm run quality:report -- --ratings out/finalized-ratings.json \
  --baseline v1.0.0 --candidate v1.1.0 --out out/quality-report.json
```

## Guardrails

- At least two engine versions are required.
- Each version must contain the exact same case IDs; unpaired designs are rejected at preparation time.
- A case/version pair can appear only once.
- The blind packet does not include `engineVersion`; the separate mapping does.
- Finalization rejects unknown artifact IDs, mismatched case IDs, duplicate reviewer submissions for an artifact, and premature `engineVersion` fields.
- The packet includes SHA-256 hashes to help verify that artifact text has not changed after preparation. These hashes are integrity checks, not proof of authorship.
- The mapping is sensitive evaluation metadata. Keep it private until scoring is complete and store it securely.
- This workflow does not independently prove that reviewers are independent, that they remained blind, or that artifact text contains no identifying clues. Those remain operational responsibilities.
- Version comparisons remain descriptive; no statistical significance, causality, or audience impact is inferred. No generation policy is automatically changed.

## Verification

The dependency-free orchestrator tests cover blind packet generation, version-label separation, paired-case validation, mapping application, unknown IDs, duplicate reviewer submissions, and case mismatch rejection. These tests do not require live model calls.
