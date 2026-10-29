# TextFX Creative Core — Increment 17

## Scope

This increment adds generation provenance to controlled creative experiments so version comparisons can expose missing or changed model/prompt/configuration settings instead of assuming they were equivalent.

## Optional provenance fields

Each artifact input may contain a `provenance` object with only these allowlisted fields:

- `modelProvider`, `modelId`, `sourceRevision` — non-empty strings;
- `promptTemplateHash`, `generationConfigHash` — 64-character SHA-256 hex strings;
- `temperature` — number from 0 to 2;
- `topP` — number from 0 to 1;
- `seed` — non-negative safe integer or non-empty string.

Unknown fields are rejected. Do not put API keys, credentials, full private prompts, user secrets, or arbitrary metadata in provenance.

## Privacy and integrity

Provenance is excluded from the public blind-review packet. It is stored in the private version mapping, committed by hash in the experiment manifest, and attached to finalized ratings only after unblinding. Integrity verification checks the provenance hashes alongside artifact hashes.

## Compare provenance

```bash
npm run provenance:audit -- \
  --ratings finalized-ratings.json \
  --baseline v1 \
  --candidate v2 \
  --out provenance-report.json
```

The report distinguishes matching settings from differing, variable, or missing fields. Different source revisions are expected when comparing engine versions. A matching model/config/prompt fingerprint improves reproducibility but is not evidence of causality or artistic quality.

## Verification performed

- `node --test backend/tests/*.test.cjs`: **43/43 passed**.
- CLI integration: prepared and finalized a 10-artifact paired experiment with mock provenance, verified integrity, and generated a provenance audit that correctly surfaced differing prompt-template hashes while model/runtime settings matched.
- This verifies the experiment tooling only. Full TypeScript build remains unverified in a dependency-complete environment.
