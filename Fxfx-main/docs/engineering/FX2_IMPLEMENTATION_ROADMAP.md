# FX2 Implementation Roadmap — Measurable Egyptian Creative Engine

Date: 2026-11-27  
Baseline: main at 8e7771ef49d8ea0af94b9594488f9b9fe619ce6d  
Execution rule: inspect → specify → implement narrowly → test → compare → commit. Each stage has its own acceptance gate.

## Executive decision

Do not rebuild FX2 and do not import external creative platforms wholesale. Keep the existing five-technique discovery, bounded metabolism, Creative Entropy, Creative Court, script review, CreativeIR, approval integrity and run provenance.

The target is not “more agents.” It is a system that creates concepts with meaningfully different strategic and creative mechanisms, judges them against human-calibrated standards, writes naturally in Egyptian Arabic, respects each brand's identity and can later learn from real campaign outcomes.

## Stage 0 — Freeze and reproducible baseline

Purpose: establish exactly what works on one commit.

Tasks:
1. Pin the reviewed commit and preserve the current branch.
2. Reconcile package-manager and lockfile strategy before installing dependencies.
3. Re-run backend tests, frontend typecheck/build and Electron TypeScript compile.
4. Re-run scoped dependency audits.
5. Trace the three current user-facing API flows and the separate Agent route.
6. Record provider/model availability without exposing keys or sending paid live calls.
7. Establish 10–15 fixed Egyptian advertising briefs for repeatable output capture.

Deliverables: architecture map, gap matrix, test baseline and raw logs, API/pipeline trace, dependency/security risk register and fixed brief benchmark set.

Exit gate: all commands are tied to one commit and reproducible logs. No implementation changes are bundled into this stage.

## Stage 1 — Pipeline and provider reliability

Purpose: make the full creative engine the canonical generation path.

Tasks:
1. Define a versioned request/response contract for a complete run.
2. Route the primary generation UX through the Agent orchestrator, retaining compatibility adapters for existing Insight/Concept/Script endpoints until migration is complete.
3. Make every stage report status, output reference, provider/model, token usage, estimated cost, latency and failure reason.
4. Ensure heuristic Court fallback and structural script-review fallback can only produce an unapproved draft / needs-review, never a ready or approved result.
5. Add regression tests for provider failure, missing credentials, truncated JSON, cancellation, timeout, budget exhaustion and fallback governance.
6. Decide supported providers. If Groq is required, add a separate Groq adapter and model allowlist; do not confuse Groq with xAI/Grok.
7. Validate task-specific output-token ceilings and complete structured JSON. Avoid globally raising token limits without budget and truncation tests.
8. Keep cost reservations explicit. Do not claim multi-process budget guarantees while reservation state is process-local.

Exit gate:
- One canonical full-pipeline request returns a versioned CreativeIR.
- No silent mock or synthetic fallback is represented as a successful AI judgment.
- Fallbacks cannot receive approval.
- Existing API compatibility tests pass.

## Stage 2 — Strategic divergence and Idea DNA

Purpose: create different ideas, not merely differently worded ads.

### 2.1 Strategic Territory Compiler

Before writing concepts, compile the brief into 3–5 genuinely different strategic territories. Each territory states:
- audience tension or behavior;
- strategic proposition;
- relationship between product and audience;
- opportunity or contradiction;
- creative constraints;
- why it differs from the other territories.

Do not use arbitrary persona labels as a substitute for strategic differences. Each generation burst receives an isolated territory/context. Do not show the judge the generator's explanation or preferred answer.

### 2.2 Mechanism Ledger

Extend the candidate contract with versioned fields:
- humanTension;
- strategicAngle;
- coreMechanism;
- audienceBehavior;
- emotionalTurn;
- visualDevice;
- narrativeStructure;
- noveltyDimensions;
- territoryId and parentIds.

### 2.3 Diversity measurement

Use a layered diagnostic:
- lexical overlap (keep as cheap first-pass signal);
- Arabic-capable semantic similarity, evaluated on short ad copy;
- structured mechanism similarity (human tension, strategic angle and core mechanism);
- human audit of false duplicates and false diversity.

Only after these descriptors work, add a bounded Quality-Diversity portfolio archive. Preserve at least one candidate from a distinct niche and a wildcard; do not let one aggregate score collapse the pool.

Exit gate:
- A fixed brief produces a pool with multiple human-confirmed mechanism families.
- Reports distinguish lexical, semantic and mechanism similarity.
- Every mutation/crossover has parent IDs, changed dimension and before/after record.
- Rejected candidates remain in the archive with reasons.

## Stage 3 — Human-calibrated Creative Court

Purpose: make selection reliable rather than merely confident.

Reuse the existing Court, rubric versioning, blind experiment orchestrator, quality lab and inter-rater reporting. Do not replace them with a new framework.

Tasks:
1. Freeze a first rubric version; do not tune weights mid-experiment.
2. Build a golden set of 40–60 Egyptian/Arabic concepts and scripts across product categories.
3. Obtain independent ratings from 2–3 Egyptian advertising practitioners per artifact where feasible.
4. Use blind, randomized evaluation. Hide model, version, lens, generator rationale and prior ranking.
5. Add pairwise comparisons for close finalists; start with the top five candidates (10 pairwise matchups).
6. Report per-criterion results, reviewer disagreement, confidence and missing ratings.
7. Compare model decisions against human judgments; record false accepts and false rejects.
8. Change weights or thresholds only in a new rubric version and rerun the same blind benchmark.

Suggested outcomes: strategic winner; strongest executable concept; most original mechanism; wildcard worth preserving; rejected candidates with reasons; human review required.

The reported AdControlCenter 20% human versus 71.8% LLM “good” split is a warning signal only, not a universal calibration target.

Exit gate: measured human/model agreement and false-accept rate are reported for a held-out set. No claim of calibration is made from model self-review.

## Stage 4 — Egyptian language and cultural quality gate

Purpose: test Egyptian advertising language as language-in-context, not word substitution.

Build a local gold set of 200–300 short ad lines labelled by Egyptian reviewers. Suggested labels:
- natural Egyptian;
- forced/unnatural Egyptian;
- Modern Standard Arabic;
- mixed/unintended dialect;
- culturally unsuitable or stereotype risk;
- unclear / needs human review.

Evaluate MARBERTv2, AraBERT dialect classifiers and candidate models on this exact short-ad domain. Use classifiers as advisory signals, with low-confidence abstention. Add checks for idiom, pragmatics, humor, cultural context, brand voice and claim integrity.

Gate decisions:
- PASS: language and context meet the agreed standard.
- REVISE: specific fixable language/cultural defect.
- HUMAN_REVIEW: ambiguity, low confidence or cultural risk.

Do not equate “Egyptian dialect detected” with “good Egyptian advertisement.” Dialogue corpora and idiom datasets are test resources, not campaign-performance evidence.

Exit gate: publish a confusion matrix and class-wise precision/recall on a held-out Egyptian advertising set, plus human adjudication report.

## Stage 5 — Versioned Brand Memory

Create a separate BrandProfile contract and store. Suggested sections:
- Brand DNA and positioning.
- Audience segments, tensions and behavior.
- Tone, voice and language.
- Approved and forbidden expressions.
- Product facts and substantiated claims.
- Claim evidence and source.
- Approved creative examples and rejection history.
- Brand-specific campaign outcomes.

Every fact carries provenance, trust state and approval: TRUSTED, CANDIDATE, SPECULATIVE or SUGGESTED.

Every run pins brandProfileId and brandProfileVersion. Creative Memory remains a separate store for procedural lessons. Do not let one brand's facts or lessons leak into another brand's context.

Exit gate: brand profiles are versioned, human-approved, isolated and covered by cross-brand leakage tests.

## Stage 6 — Bounded evolution and Pre-Mortem

Retain current mutation/crossover; do not add a large evolutionary framework.

For the best two or three candidates:
1. Record the original candidate as immutable.
2. Identify one defect or opportunity.
3. Change one dimension at a time (insight, audience tension, mechanism, medium or execution).
4. Re-run the independent Court.
5. Keep the best-so-far version, not automatically the latest version.
6. Preserve failed offspring and rejection reasons.
7. Stop after at most three rounds or earlier when external quality is flat and diversity is degrading.

Add a bounded Creative Pre-Mortem before final approval. It identifies why an idea might fail (comprehension, competitor substitutability, execution cost, brand mismatch, cultural risk or unsupported claims) and proposes repairs. It is not an automatic idea-killing agent.

Exit gate: human-rated quality improves or remains stable without collapsing mechanism diversity; every round is traceable and bounded.

## Stage 7 — Campaign outcome intelligence

The supplied research reports no verified open Egyptian/Arabic advertising dataset with real CTR, conversion or sales outcomes. Build schema and import path first; do not invent training data.

Link:
Brief → Idea → Concept Version → Script Version → Published Variant → Campaign → Outcome

Record campaign objective, channel, audience, dates, attribution window, impressions, clicks, CTR, conversions, CPA, sales lift where available, spend/currency, source system, import timestamp, attribution method and data-quality notes.

Keep evidence types distinct:
- AI_PREDICTED
- HUMAN_RATED
- REAL_CAMPAIGN_RESULT

Start with validated CSV import and explicit mapping. Do not automatically optimize generation policy until there are enough comparable, attributable observations.

Exit gate: imported rows reconcile to source totals, link to exact creative versions and retain provenance.

## Stage 8 — Live Control Room and release hardening

Only after backend contracts and event semantics are stable:
- add SSE or another explicit event subscription;
- display real stage transitions, model calls, budget use and failures;
- show candidate portfolio and lineage;
- expose human approval and version-pinned decisions;
- verify Electron runtime/package and mobile builds separately.

Do not present a polling status panel as a live event stream.

## Initial benchmark protocol

Start with 10–15 stable Egyptian briefs across FMCG/food, services, retail/e-commerce, apps/technology and public-interest/social campaigns.

For each brief, save raw candidate pools, mechanism ledgers, scripts, provenance, cost and latency. Run repeated generations under the same model/configuration. Human reviewers score blind. Keep a holdout set that is never used to tune prompts or rubric weights.

## Core metrics

| Dimension | Metric |
|---|---|
| Strategic diversity | Number of human-confirmed distinct territories |
| Mechanism diversity | Distinct mechanism families in top-N |
| Semantic diversity | Mean/max Arabic semantic similarity, audited for false positives |
| Court quality | Pairwise agreement with human panel; false-accept and false-reject rates |
| Egyptian quality | Class-wise precision/recall and human naturalness rating |
| Brand adherence | Unsupported claim rate and forbidden-expression violation rate |
| Evolution | Human-rated gain over parent and best-so-far retention |
| Reliability | Completion rate, schema validity, fallback rate |
| Efficiency | Cost and latency per stage and per accepted concept |
| Market learning | Real KPI coverage and attribution confidence |

## Rules for every implementation task

- Touch only files required by the task.
- Preserve existing APIs unless a versioned migration is approved.
- Add tests before changing selection policy.
- Never delete or overwrite historical candidate artifacts.
- Never claim a command passed unless executed and raw result saved.
- Never store credentials in source, docs, test fixtures or prompts.
- Do not import external code without license and supply-chain review.
- Keep source changes separate from baseline and research documentation commits.
