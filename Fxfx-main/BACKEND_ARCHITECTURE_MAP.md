# Backend Architecture Map

Status: PRELIMINARY / STATIC REVIEW  
Baseline HEAD: 8e7771ef49d8ea0af94b9594488f9b9fe619ce6d  
Review date: 2026-11-27

The detailed source-backed architecture map is maintained at:

- docs/engineering/FX2_ARCHITECTURE_MAP.md

The map covers:
- Express entrypoint, middleware and route registration.
- Agent route and Agent service orchestration.
- Provider adapters and LLM gateway.
- Creative modules and CreativeIR.
- Run snapshots, append-only event log and idempotency store.
- Primary frontend API flow versus the separate Agent panel.

Evidence status:
- Source paths inspected: PRESENT.
- Route-to-module wiring: PARTIALLY TRACED.
- Runtime execution on this HEAD: NOT RUN.
- TypeScript/build/test verification on this HEAD: NOT RUN.

This document is not a runtime certification. Complete BE-01 under MASTER_ENGINEERING_ROADMAP.md before marking the architecture map VERIFIED.
