# FX2 Gap Matrix — Evidence-Based Decisions

Date: 2026-11-27  
Baseline: main at 8e7771ef49d8ea0af94b9594488f9b9fe619ce6d  
Evidence rule: “Present” means visible in inspected source. “Not verified” is not silently upgraded to “missing” or “working.”

## Priority matrix

| Priority | Area | Observed state | Gap / risk | Decision |
|---|---|---|---|---|
| P0 | Reproducible baseline | Several historical reports exist | Totals conflict (167/168/185/206); no current GitHub check runs | Re-run from clean checkout and pin commit, runtime and package-manager path |
| P0 | Multiple generation paths | Main UI calls Insight, Concept and Script separately; /api/full-pipeline runs a legacy sequential flow; Agent panel calls /api/agent/run | Three paths can produce different behavior and provenance | Inventory contracts and define backend compatibility policy; defer client migration until backend acceptance |
| P0 | Fallback governance | Court and script-review fallbacks are labelled; Agent flow continues with a draft | Ensure fallback-derived output cannot be marked ready or approved | Add fail-closed approval invariant and regression tests |
| P0 | Provider reliability | Gemini/OpenAI/OpenRouter/xAI adapters present | Groq adapter absent; old provider probes incomplete | Decide supported providers; if Groq is required, add a distinct adapter with model allowlist, usage and budget tests |
| P1 | Strategic diversity | Five technique-specific lenses exist | Five techniques do not guarantee different strategic territories or mechanisms | Add a pre-generation Strategic Territory/Challenge compiler |
| P1 | Idea DNA | CreativeIR and candidate lineage exist | No complete explicit mechanism ledger demonstrated | Add versioned fields for human tension, strategic angle, core mechanism, audience behavior, emotional turn, visual device and narrative structure |
| P1 | Semantic diversity | Jaccard/lexical diagnostics exist | Different wording can hide the same mechanism; embeddings alone are insufficient | Combine lexical diagnostics, Arabic-capable semantic similarity and structured mechanism comparison |
| P1 | Quality-Diversity | Candidate archive and lineage exist | No proven niche-preserving QD archive in inspected core | Add a small portfolio archive only after descriptors and human quality labels exist |
| P1 | Court calibration | Six-criterion rubric, blind workflow and quality-lab tooling exist | No current Egyptian human-calibration result; saved weights are not ground truth | Freeze rubric, build human golden set and pairwise evaluation before changing weights |
| P1 | Egyptian language/culture | Arabic language resolution and language checks exist | No independently verified Egyptian advertising naturalness/cultural gate in inspected core | Build Egyptian test set and PASS/REVISE/HUMAN_REVIEW gate |
| P1 | Brand Memory | Local creative lesson memory exists | Not a per-brand, versioned, approval-backed profile | Add separate BrandProfile store; do not overload Creative Memory |
| P2 | Campaign outcomes | Counterfactual review and evaluation ledger exist | No verified import/linkage of published campaigns and real KPIs | Add outcome schema/import path; do not claim market learning until real data arrives |
| P2 | Live run UI | Append-only events and JSON lifecycle endpoint exist | No live SSE/EventSource subscription observed | Defer until backend event contract is stable |
| P2 | Distributed operation | Run/budget state includes process-local components | Multi-process budgets are not atomic per saved report | Keep single-process claim until shared storage and concurrency tests exist |
| P2 | Release/security | Saved reports show clean production-only audits but unresolved build advisories | Audit artifacts have different totals/scopes and are not fresh on this commit | Re-run backend, app and root audits separately; upgrade majors only with compatibility tests |

## Creative design decisions

### Keep
- Five existing lateral-thinking techniques.
- Custom Agent orchestrator.
- Bounded mutation and crossover.
- Candidate lineage and rejection history.
- Creative Court and rubric versioning.
- Script review and targeted revision.
- Counterfactual replay as observational evidence only.
- CreativeIR and human approval integrity.
- Existing browser evidence rules and untrusted-source boundary.

### Add
1. Strategic Territories before concept wording.
2. Idea DNA / Mechanism Ledger on each candidate.
3. Semantic and mechanism-level diversity diagnostics.
4. Portfolio preservation so one high score does not erase every other niche.
5. Human-calibrated pairwise court evaluation.
6. Egyptian advertising naturalness and cultural gate with abstention.
7. Versioned Brand Memory separate from procedural lessons.
8. Campaign outcome records linked to exact artifact versions.
9. Explicit run cost/latency/provenance per stage.

### Do not add now
- A replacement orchestration framework.
- A large agent swarm.
- Full OpenEvolve/ShinkaEvolve/DGM-style code evolution systems.
- Commercial or prototype ad generators as core dependencies.
- Non-commercial/GPL code into a proprietary distribution without a license decision.
- Synthetic audience ratings as campaign outcome evidence.

## Dataset and evidence policy

- The supplied research reports no verified open Egyptian/Arabic advertising dataset with real CTR, conversion or sales outcomes.
- The 606-image Egyptian advertising collection may support visual-rubric experiments after verifying original record, labels and license. It is not a performance dataset.
- The 1,698 Arabic caption collection stays quarantined until original source, DOI/file and license are verified.
- Kinayat and Egyptian dialogue resources can help test pragmatic language and idioms; they do not prove advertising effectiveness.
- Effie/WARC cases can be reference material where rights allow; they are not automatically reusable training data.
- The AdControlCenter human-vs-LLM result is a warning signal only; the reported human sample is limited and the domain is not a direct test of FX2 Egyptian text concepts.

## Acceptance principles

- A candidate is not diverse merely because its words differ.
- A candidate is not original merely because an LLM says so.
- A candidate is not Egyptian-natural merely because a dialect classifier labels it Egyptian.
- A script is not ready when its judge failed and a heuristic fallback was used.
- A creative lesson is not a brand fact.
- A model prediction or synthetic audience response is not a real campaign KPI.
