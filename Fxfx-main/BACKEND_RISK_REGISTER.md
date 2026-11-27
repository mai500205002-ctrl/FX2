# Backend Risk Register — Preliminary

Status: OPEN / STATIC REVIEW  
Baseline HEAD: 8e7771ef49d8ea0af94b9594488f9b9fe619ce6d  
Review date: 2026-11-27

Likelihood and impact are preliminary engineering judgments, not measured incident rates.

| ID | Risk | Likelihood | Impact | Evidence / trigger | Mitigation | Status |
|---|---|---|---|---|---|---|
| R-01 | Historical test reports do not identify one reproducible current baseline | High | High | Reports claim 167/168/185/206; no current check runs returned | Clean checkout, pin toolchain and package manager, run full suite, save logs | Open; BE-00 |
| R-02 | Package-manager/lockfile ambiguity causes dependency tree drift | High | High | Root npm workspace plus root/backend/app pnpm lockfiles; prior report documents mixed-manager conflicts | Select one supported install path per clean worktree; document hashes and commands | Open; BE-00 |
| R-03 | Backend authentication/authorization exceptions are not fully revalidated on current HEAD | Medium | Critical | Master roadmap lists specific audit leads; no current runtime test performed | Audit every protected route, missing-secret behavior, session, approval token, Origin/CORS and fail-closed behavior | Open; BE-05/06 |
| R-04 | Heuristic Court/reviewer fallback may be confused with accepted creative judgment | Medium | High | Agent flow records labelled fallback and continues producing a draft | Ensure fallback-derived runs cannot be ready/approved; add explicit regression tests | Open; BE-09/10 |
| R-05 | Provider configuration and live-provider reliability are not established on current HEAD | High | High | Historical probes report mixed failures; no current live run; Groq adapter absent if required | Keep provider calls disabled in baseline; test adapters with fixtures; require approval before paid live call | Open; BE-14 |
| R-06 | Run/budget persistence is process-local and may not be atomic across workers | Medium | High | Saved final report explicitly states cross-process budget reservations are not atomic | Preserve single-user/single-process scope; test restart/recovery; do not claim distributed guarantees | Open; BE-15/16 |
| R-07 | Browser research could introduce untrusted claims or SSRF exposure if policy regresses | Medium | High | Browser Agent handles external page content; security boundary is consequential | Maintain read-only policy, DNS/IP/redirect protections, integrity hashes and unreviewed evidence state | Open; BE-12/13 |
| R-08 | Saved dependency audit artifacts disagree in totals/scope | High | High | JSON audit and final report contain different full-audit totals | Fresh scoped audits on exact HEAD; classify prod vs dev/build dependencies; review major upgrades | Open; BE-18 |
| R-09 | Frontend primary flow and Agent orchestrator are separate paths | High | Medium | App.tsx calls three stage endpoints; Agent panel calls /api/agent/run | Document API compatibility and defer frontend integration until backend acceptance | Open; deferred client scope |
| R-10 | No independently validated Egyptian ad-quality benchmark currently gates output | High | Medium | Research reports no current Egyptian dialect/naturalness gold set | Keep as future product research; build human-labelled short-ad benchmark after current backend closure | Deferred |
| R-11 | No verified real Egyptian campaign-outcome dataset is available in supplied research | High | Medium | Research files report none found | Do not train or optimize from synthetic data; later support provenance-backed CSV outcome import | Deferred |
| R-12 | Brand lessons and brand identity could be conflated | Medium | Medium | Existing Creative Memory stores bounded lessons, not a versioned per-brand profile | Keep stores separate; add BrandProfile only in an authorized future increment | Deferred |

## Governance

- No paid LLM/API operation without prior approval and cost/risk disclosure.
- No destructive data operation, public deployment or irreversible security change without explicit approval.
- No source edits, commits, pushes or deployments without authorization for the specific action.
- Reclassify risks only with current source, test or runtime evidence.
- A risk is not closed because a test file exists; it closes when the relevant acceptance criterion is executed and verified.
