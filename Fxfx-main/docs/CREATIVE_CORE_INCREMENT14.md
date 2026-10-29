# TextFX Creative Core — Increment 14

## Scope

This increment adds two audit-oriented capabilities to the creative evaluation workflow:

1. **Inter-rater agreement diagnostics**: pairwise exact agreement and linearly weighted agreement, computed per artifact/criterion and in aggregate. Missing criterion scores, fewer than two observations, and high score spread are flagged for human discussion.
2. **Experiment integrity manifest**: stable SHA-256 hashes for the benchmark, scoring protocol, blind packet, private version mapping, and each artifact's text. Finalization can verify these hashes before unblinding.

## Prepare a blind experiment

```bash
node scripts/creative-experiment-orchestrator.cjs prepare \
  --artifacts artifacts.json \
  --packet-out out/blind-packet.json \
  --mapping-out private/version-mapping.json \
  --manifest-out out/experiment-manifest.json
```

Keep the private mapping away from reviewers. The manifest contains no engine-version labels, but should still be stored with the experiment's audit materials.

## Verify and finalize ratings

```bash
node scripts/creative-experiment-orchestrator.cjs finalize \
  --ratings blind-ratings.json \
  --mapping private/version-mapping.json \
  --packet out/blind-packet.json \
  --manifest out/experiment-manifest.json \
  --out out/finalized-ratings.json
```

The optional `--benchmark` flag can specify the benchmark JSON used during preparation. If packet, mapping, or benchmark content differs from the manifest, finalization stops rather than silently accepting the changed files.

## Analyze reviewer agreement

```bash
npm run agreement:report -- \
  --ratings out/finalized-ratings.json \
  --out out/agreement-report.json
```

The report contains:
- pairwise exact agreement rate;
- pairwise linear-weighted agreement (difference normalized against the 1–5 scale);
- criterion-level score spread and sample standard deviation;
- missing-score and disagreement alerts;
- explicit limitations and a reminder that original scores are not overwritten.

## Interpretation and limitations

These are descriptive agreement diagnostics, not a formal chance-corrected reliability coefficient such as Krippendorff's alpha. Agreement does not prove the benchmark measures audience impact or artistic quality. A disagreement alert asks for documented human review; it does not discard or silently change ratings. No generation policy is modified automatically.

## Verification performed

- `node --test backend/tests/*.test.cjs`: **26/26 passed**.
- CLI integration test: prepared a 10-artifact paired blind packet, verified packet/mapping/benchmark hashes, finalized 30 mock ratings, and generated the agreement report.
- Full TypeScript build was not run successfully in a dependency-complete environment; this increment adds CommonJS scripts and tests, but the repository-wide build status remains unverified.
