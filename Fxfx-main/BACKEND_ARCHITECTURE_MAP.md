# Backend Architecture Map

Status: BE-01 source inspection complete; not runtime-certified
Current HEAD inspected: fa6192628e08d6f7064851328e75dad802b196a0
Review date: 2026-11-28

The historical architecture snapshot is maintained at:

- docs/engineering/FX2_ARCHITECTURE_MAP.md

The current BE-01 backend execution map is:

- docs/engineering/BE-01_BACKEND_EXECUTION_MAP.md

The map covers:
- Express entrypoint, middleware and route registration.
- Agent route and Agent service orchestration.
- Provider adapters and LLM gateway.
- Creative modules and CreativeIR.
- Run snapshots, append-only event log and idempotency store.
- Primary frontend API flow versus the separate Agent panel.

Evidence status for the current BE-01 map:
- Source paths inspected: PRESENT.
- Route-to-module wiring: TRACED by static inspection.
- Runtime execution on this HEAD: NOT RUN.
- TypeScript/build/test verification during BE-01: NOT RUN.

The previous architecture snapshot records commit 8e7771ef49d8ea0af94b9594488f9b9fe619ce6d and is historical, not verification of the current HEAD. The current map is a source-inspection result, not a runtime or security certification.
