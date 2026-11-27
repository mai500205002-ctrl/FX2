# FX2 Test Baseline — Historical Evidence and Current Verification Status

Review date: 2026-11-27  
Reviewed commit: 8e7771ef49d8ea0af94b9594488f9b9fe619ce6d  
Important: This records repository evidence. It does not claim that tests were executed during the 2026-11-27 static review.

## 1. Current verification status

| Check | Status in this review |
|---|---|
| Repository tree and source inspection | Completed |
| Local dependency installation | Not performed |
| Backend TypeScript build | Not run |
| Backend test suite | Not run |
| Frontend typecheck/build | Not run |
| Electron TypeScript compile | Not run |
| Browser/Chromium E2E execution | Not run |
| Live provider-backed full pipeline | Not run |
| Fresh dependency audit on reviewed commit | Not run |
| Current GitHub Actions/check-runs | No check runs returned for reviewed HEAD |

## 2. Conflicting historical test totals

| Artifact | Reported result | Interpretation |
|---|---:|---|
| REPORT-INCREMENT27.md | 167 passed | Historical Increment 27 report |
| FX_EXECUTION_REPORT.md | 168 passed | Separate execution snapshot/report dated 2026-10-27 |
| FX_FINAL_REPORT.md | 185 passed in one section | Earlier verification summary |
| FX_FINAL_REPORT.md | 206 passed in a later verification section | Highest/latest saved total found in that report |

These totals must not be averaged or treated as a current HEAD result. The 206 figure is the latest saved claim found, but it has not been reproduced on the reviewed commit. The report's header date and later appended verification sections also make provenance/version alignment important to verify.

## 3. Existing test coverage visible in the repository

The backend suite includes tests for:
- Agent idempotency and pipeline orchestration.
- Run-store persistence and lifecycle events.
- Approval integrity.
- Browser agent policy and browser behavior.
- Candidate archive and CreativeIR contracts.
- Creative core, discovery lenses, metabolism/entropy and evaluation.
- Creative quality lab and blind experiment orchestration.
- Inter-rater agreement, policy review and human trial governance.
- Provenance audit and repeated-run stability.
- Gateway budgets and Gemini/provider routing.
- Full pipeline E2E and frontend product flow.
- Security governance, SaaS routes and browser hardening.

The test README explicitly says passing software tests does not establish artistic quality, originality or audience impact. The creative benchmark requires real generated artifacts and blinded human scoring.

## 4. Historical verification claims and limitations

### FX_EXECUTION_REPORT.md (2026-10-27)

The report records:
- Backend: 168 passed, 0 failed, 0 skipped.
- Frontend typecheck and Vite production build passed.
- Electron TypeScript compile passed.
- Backend and app production-only dependency audits reported zero vulnerabilities.
- Backend health endpoints returned HTTP 200.

It also records that real Chromium execution, live Gemini generation, Windows packaging/installer and a live frontend-to-backend browser session were not run.

### FX_FINAL_REPORT.md (2026-10-28, with later appended verification sections)

The report records a later 206-test backend pass, frontend typecheck/build, Electron TypeScript compile, and clean production-only backend/app audits.

It also records:
- No complete live Brief → Insight → Concept → Script result was established.
- The historical live provider attempt failed during Insight after a truncated/unsuccessful provider response.
- Electron runtime/installer verification was not performed.
- Budget reservations are process-local and not atomic across multiple backend processes.
- Full development/build dependency advisories remained unresolved, even though production-only audits were reported clean.

These are historical records, not fresh test results on the reviewed commit.

## 5. Audit artifact mismatch

The saved files do not provide one consistent dependency-audit snapshot:
- FX_FINAL_RUNTIME_AUDIT.json reports zero vulnerabilities for its recorded dependency set.
- FX_FINAL_FULL_AUDIT.json reports 10 findings in its own metadata (9 high, 1 moderate).
- Later text in FX_FINAL_REPORT.md describes different full-audit totals across root/Electron, app and backend scopes.

Do not merge these figures. Re-run audits from clean installs and record:
1. Exact commit SHA.
2. Node/npm/pnpm versions.
3. Lockfile and package scope.
4. Command and exit code.
5. Complete machine-readable report.
6. Production-only versus development/build dependency scope.

## 6. Test fixture note

The repository includes backend/tests/fixtures/key.pem and cert.pem. The historical execution report says these are a matching self-signed loopback TLS test pair, not production credentials. Preserve them as test fixtures unless fresh inspection proves otherwise. Never reuse them as production TLS material.

## 7. Reproducible baseline procedure

Run only in a clean disposable checkout/worktree of the exact reviewed commit. Do not mix npm and pnpm installs in the same dependency tree: the historical execution report documents dependency replacement/conflicts when workspace managers were mixed.

Before running:
- Record git rev-parse HEAD and git status --short.
- Record Node, npm and pnpm versions.
- Inspect root, backend and app manifests and lockfiles.
- Select and document one install strategy for the baseline run.
- Keep live API keys out of logs and do not call paid providers.

Minimum commands after the install strategy is pinned:

```bash
npm --prefix Fxfx-main/backend test
npm --prefix Fxfx-main/app run typecheck
npm --prefix Fxfx-main/app run build
./Fxfx-main/backend/node_modules/.bin/tsc -p Fxfx-main/electron-src/tsconfig-electron.json --noEmit
```

If the selected install strategy does not expose these binaries, stop and resolve package-manager/lockfile policy rather than silently installing a second dependency tree.

## 8. Required output from the next baseline run

Save:
- Commit SHA and worktree status.
- Runtime and package-manager versions.
- Exact install command and lockfile hashes.
- Backend test log and machine-readable summary.
- Frontend typecheck/build logs.
- Electron compile log.
- Scoped dependency audit JSON files.
- Explicit list of tests not run and why.

No source changes should be mixed into this baseline commit.
