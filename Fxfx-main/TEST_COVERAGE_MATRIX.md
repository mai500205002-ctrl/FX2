# Backend Test Coverage Matrix

Status: PRELIMINARY FILE-LEVEL INVENTORY  
Baseline HEAD: 8e7771ef49d8ea0af94b9594488f9b9fe619ce6d  
Review date: 2026-11-27

There are 27 backend files matching tests/*.test.cjs in the reviewed tree. The categories below are inferred from filenames and the test README; individual assertions have not all been inspected and no test was run during this review.

| Test file | Apparent coverage area | Status |
|---|---|---|
| agent-idempotency.test.cjs | Request idempotency and duplicate handling | File present; execution NOT RUN |
| agent-pipeline.test.cjs | Agent orchestration and stage behavior | File present; execution NOT RUN |
| agent-run-store.test.cjs | Run persistence and lifecycle store | File present; execution NOT RUN |
| approval-integrity.test.cjs | Artifact approval binding/integrity | File present; execution NOT RUN |
| browser-agent.test.cjs | Browser Agent behavior/policy | File present; execution NOT RUN |
| candidate-archive.test.cjs | Candidate history and decisions | File present; execution NOT RUN |
| core-contracts.test.cjs | CreativeIR/domain contracts | File present; execution NOT RUN |
| creative-core.test.cjs | Creative memory/counterfactual invariants | File present; execution NOT RUN |
| creative-experiment-orchestrator.test.cjs | Blind packet preparation/finalization | File present; execution NOT RUN |
| creative-inter-rater-agreement.test.cjs | Reviewer agreement reporting | File present; execution NOT RUN |
| creative-policy-review.test.cjs | Evidence-gated policy review | File present; execution NOT RUN |
| creative-provenance-audit.test.cjs | Model/prompt/generation provenance | File present; execution NOT RUN |
| creative-quality-lab.test.cjs | Human-rated quality aggregation | File present; execution NOT RUN |
| creative-run-stability.test.cjs | Repeated-run stability analysis | File present; execution NOT RUN |
| creative-trial-governance.test.cjs | Human trial decisions and audit chain | File present; execution NOT RUN |
| discovery-lenses.test.cjs | Five-lens discovery | File present; execution NOT RUN |
| evaluation-lab.test.cjs | Evaluation and counterfactual behavior | File present; execution NOT RUN |
| frontend-product-flow.test.cjs | Frontend product flow and backend boundary | File present; execution NOT RUN |
| full-pipeline-e2e.test.cjs | Full pipeline with deterministic provider fixtures | File present; execution NOT RUN |
| gateway-budget.test.cjs | Call/run budget reservation and enforcement | File present; execution NOT RUN |
| gemini-gateway.test.cjs | Gemini adapter/gateway behavior | File present; execution NOT RUN |
| increment22-browser-hardening.test.cjs | Browser security hardening | File present; execution NOT RUN |
| provider-routing.test.cjs | Provider/model routing | File present; execution NOT RUN |
| release-candidate-e2e.test.cjs | Release candidate integration behavior | File present; execution NOT RUN |
| research-stage-context.test.cjs | Research context and evidence handling | File present; execution NOT RUN |
| saas-route.test.cjs | SaaS route behavior (scope remains single-user) | File present; execution NOT RUN |
| security-governance.test.cjs | Authentication/security governance | File present; execution NOT RUN |

## Historical run evidence

Saved reports contain 167, 168, 185 and 206 passing-test totals. These are historical claims with differing snapshot/command provenance. The highest saved total is 206 in FX_FINAL_REPORT.md; it is not a fresh run on the reviewed HEAD.

## Required next actions

1. Read each test file and map assertions to BE-00 through BE-18 requirements.
2. Identify untested negative cases and route coverage.
3. Run the complete suite from a clean checkout after pinning package-manager strategy.
4. Record exact commit, runtime versions, command, exit code, pass/fail/skip totals and raw log.
5. Keep deterministic fixtures distinct from live provider, browser and market-outcome evidence.

The test README explicitly warns that software tests do not prove artistic quality, originality or audience impact.
