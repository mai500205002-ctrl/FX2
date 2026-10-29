# TextFX Repository Initialization Report

**Date:** 2026-10-25  
**Environment:** Linux, Node.js/npm in the provided workspace

## Restoration

- Restored the project from `TextFX-Increment20-CoreContracts.zip`, whose project root in the archive is `TextFX-Creative-Core-Increment19/`.
- Merged `backend/src/` and `backend/tests/` from `TEXTFX-INCREMENT22.zip`, whose archive root is `TextFX-Increment22/`.
- Kept the Increment20 `backend/package.json`; the Increment22 archive contains only `package.json.unchanged-reference`, not an updated package manifest.
- Confirmed the restored backend contains its package and TypeScript configuration, Increment22 browser sources/tests, and 12 top-level `*.test.cjs` files. The Increment20 package manifest matches the extracted original.
- All three ZIP archives passed `unzip -t`. Existing workspace reports, archives, and test log were preserved.

## Build and Test Results

Commands were run from `backend/`, where the package, `tsconfig.json`, and test files reside.

| Command | Result |
|---|---|
| `npm install --ignore-scripts --no-audit --no-fund` | Exit 0; installed 313 packages |
| `./node_modules/.bin/tsc -p tsconfig.json` (initial attempt) | Failed; TypeScript executable was not installed by the dependency install |
| `npm install --no-save --ignore-scripts --no-audit --no-fund typescript@5.4.5 @types/node@18.19.0` | Exit 0; installed 2 packages without saving them |
| `./node_modules/.bin/tsc -p tsconfig.json` (retry) | Exit 0; no compiler errors |
| `node --test tests/*.test.cjs` | Exit 0; 121 tests, 121 passed, 0 failed, 0 skipped |

The npm install emitted dependency deprecation warnings. The tests emitted a Node TLS `ServerName` deprecation warning; neither affected the successful build or test result.

## Notes

`inc21-baseline-blocker-logs.zip` contains audit/log files, not an Increment21 source tree, so no Increment21 code was extracted. No test result above is inferred from the archived success log; the build and complete test suite were run in this workspace.