# FX2 Architecture Map — Verified Static Baseline

Review date: 2026-11-27  
Repository: mai500205002-ctrl/FX2  
Reviewed branch: main  
Reviewed commit: 8e7771ef49d8ea0af94b9594488f9b9fe619ce6d  
Project directory: Fxfx-main/  
Review type: Static source inspection. No code was changed and no tests were executed in this review.

## 1. System shape

The repository contains a React/Vite/TypeScript frontend, an Express/TypeScript backend, Electron packaging code and a creative-agent orchestration layer.

### Frontend
- app/src/App.tsx — primary product workflow and output rendering.
- app/src/backend-fetch.ts — authenticated/backend request helper.
- app/src/components/AgentSaaSPanel.tsx — separate Agent run/status panel.
- app/src/components/BrowserAgentPanel.tsx — browser research UI.
- app/src/components/GatewayMetricsPanel.tsx — gateway telemetry UI.

Important integration finding: three backend generation paths coexist. App.tsx calls POST /api/insight, then POST /api/concept, then POST /api/script as separate requests. POST /api/full-pipeline performs a legacy sequential Insight → Concept → Script flow. AgentSaaSPanel separately calls POST /api/agent/run, which invokes the full creative-agent orchestration. The primary UI flow does not currently use the Agent orchestrator as its single source of truth. Treat this as a contract/architecture finding; frontend migration is deferred by the controlling roadmap.

### Backend
- backend/src/index.ts — Express app, middleware, health, auth, provider and metrics wiring.
- backend/src/agent/agent-route.ts — Agent run, status, history, events, approval and audit routes.
- backend/src/agent/agent-service.ts — main orchestration.
- backend/src/agent/agent-run-store.ts — run snapshots, append-only JSONL lifecycle events and idempotency records.
- backend/src/core/creative-ir.ts — versioned canonical creative artifact and validation.
- backend/src/gateway/llm-gateway.ts — provider calls, budgets, usage/cost estimates, timeouts and routing.
- backend/src/gateway/provider-adapters.ts — provider definitions and model resolution.
- backend/src/modules/ — insight, discovery, metabolism, entropy, court, memory, script writing/review, candidate archive, counterfactual replay and quality analysis.

## 2. Current Agent pipeline

The orchestration in agent-service.ts follows this sequence:

1. Validate provider configuration and build a run context.
2. Create an execution plan.
3. Generate an insight.
4. Retrieve relevant creative lessons.
5. Generate up to five technique-specific candidates.
6. Run bounded Idea Metabolism (at most one mutation and one crossover).
7. Run Creative Entropy (one targeted lexical-diversification attempt when its threshold is reached).
8. Run Creative Court.
9. Develop the selected concept into a script.
10. Review the script and optionally make one targeted revision.
11. Run a shadow/counterfactual comparison where an eligible alternative exists.
12. Record lessons and evaluation evidence.
13. Assemble and validate CreativeIR, then persist the completed run.

The five existing discovery lenses are Provocation, Analogy, Random Stimulus, Opposite Thinking and Constraint Reversal.

## 3. Existing creative mechanisms

| Component | Present implementation | Current limitation |
|---|---|---|
| Insight | Five lateral-thinking techniques | No demonstrated strategic-territory compiler before writing |
| Discovery | One candidate per lens, failed-lens tracking | Ranking is heuristic, not a creativity score |
| Discovery score | 45% lexical relevance, 35% distinctiveness, 20% completeness | Cannot establish creative novelty |
| Metabolism | Bounded mutation/crossover with parent IDs | No proof yet that offspring improve human-rated quality |
| Entropy | Jaccard/lexical diagnostics; default trigger 0.68; one regeneration | Does not measure semantic or mechanism similarity |
| Court | Six weighted criteria; backend calculates score | Weights require human calibration; fallback needs a strict release gate |
| Script review | Structured review, objections and at most one revision | Human agreement and Egyptian advertising quality remain unproven |
| Counterfactual | Shadow-only alternative review | Observational evidence, not market-performance evidence |
| Creative Memory | Up to 160 bounded lessons in local JSON state | Procedural lessons, not per-brand identity |
| CreativeIR | Versioned structured artifact with provenance and lineage | Add Idea DNA/mechanism fields as a versioned extension |
| Run state | Run snapshots, append-only JSONL events and idempotency | Process-local storage; UI has no live event subscription |

## 4. Court contract currently in code

The current rubric in creative-court.ts is:

| Criterion | Weight |
|---|---:|
| Brief / Goal Fit | 25% |
| Insight Depth | 20% |
| Originality | 20% |
| Emotional / Strategic Coherence | 15% |
| Execution Clarity | 10% |
| Risk / Ethical Awareness | 10% |

Do not change these weights based on intuition. Preserve the current rubric version and create a new evaluation version for each experiment.

The court has an explicitly labelled heuristic fallback. In agent-service.ts, a court failure is caught, a fallback decision is recorded, and the pipeline continues to concept/script production. Candidate decisions are marked blocked when the review is not a valid model review. Add a regression invariant that fallback court or fallback script review can never produce a ready verdict or approved artifact. The draft may still be returned as unapproved if that is the intended behavior.

## 5. Providers and runtime

The inspected provider adapter defines Gemini, OpenAI, OpenRouter and xAI/Grok. It does not define Groq. Grok and Groq are different providers. If Groq is a product requirement, add it as a separately tested adapter.

The gateway includes request/run budgets and cost estimates. The saved final report explicitly states that budget reservations are process-local and are not atomic across multiple backend processes. Do not claim distributed budget enforcement until shared atomic storage exists.

## 6. User-visible execution

- The Agent route exposes a JSON lifecycle endpoint at GET /api/agent/runs/:runId/events.
- The run store appends lifecycle records to JSONL and persists run snapshots.
- The inspected frontend does not show an EventSource/SSE subscription to this endpoint.
- The Agent panel refreshes status and run data; it is not yet a live event-driven control room.
- Keep UI redesign out of the first backend milestones.

## 7. Data boundaries

Keep these separate:
1. Brand Memory: approved brand identity, voice, audience, claims and product facts.
2. Creative/Procedural Memory: lessons from prior reviews and anti-patterns.
3. Run Artifacts: briefs, candidates, scripts, provenance and decisions.
4. Campaign Outcomes: published variant, channel, audience, attribution window and observed KPIs.

AI scores, human ratings, synthetic audience feedback and real campaign results must never be represented as the same evidence type.

## 8. Out of scope for the first implementation

- Replacing the custom orchestrator with LangGraph, CrewAI or AutoGen.
- Adding a large multi-agent swarm.
- Importing external creative repositories wholesale.
- Rebuilding the frontend before backend contracts are stable.
- Treating lexical difference, LLM self-review or synthetic audience reactions as proof of originality or market success.
- Training on unverified datasets or copyrighted campaign case studies.

## 9. Source files reviewed

app/src/App.tsx; app/src/components/AgentSaaSPanel.tsx; backend/src/index.ts; backend/src/agent/agent-route.ts; backend/src/agent/agent-service.ts; backend/src/agent/agent-run-store.ts; backend/src/core/creative-ir.ts; backend/src/gateway/llm-gateway.ts; backend/src/gateway/provider-adapters.ts; backend/src/modules/discovery-engine.ts; backend/src/modules/idea-metabolism.ts; backend/src/modules/creative-entropy.ts; backend/src/modules/creative-court.ts; backend/src/modules/creative-memory.ts; backend/src/modules/creative-quality-lab.ts.

This map is a source-inspection snapshot, not runtime certification.
