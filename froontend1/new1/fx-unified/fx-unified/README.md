# FX Unified Frontend

Base: **FX-Creative-vo** (Next.js 16, bilingual AR/EN with RTL, reducer + `FxService` seam, command palette, AI panel).

## Run
```bash
# 1) backend (apply the small patch first: ../backend-patch/accept-structured-payloads.patch)
cd backend && npm i && npm run dev -- --port=4002     # keytar is optional; without AI keys the backend answers with mock data
# 2) frontend
cd fx-unified && npm i && npm run dev                 # http://localhost:3000, proxies /fx-api/* -> 127.0.0.1:4002/api/*
```
Env: `FX_BACKEND_URL` (default `http://127.0.0.1:4002`), `NEXT_PUBLIC_FX_MODE=mock` for the offline demo.

## Contract mapping (frontend stage <- backend)
| Stage | Endpoint | Mapping |
|---|---|---|
| Strategy | POST /api/insight | mainInsight→insight, emotionalTruth→audienceInsight, constraints→tension, opportunities→opportunity, metaphoricFraming→territory, creativeMethod→direction |
| Ideas | POST /api/concept (×N, one per engine, `archetype`=engine) | title→bigIdea, tagline→hook, coreIdea→message, creativeDevice→theme, targetParadox→territory |
| Refine / regenerate | POST /api/concept | steered with the instruction / a different engine |
| Script | POST /api/script | beats[]→3 scenes (10s each), cameraLanguage→camera |
| Agent & Governance | /api/agent/run, /runs | plan, trace, evaluation, "adopt in workspace" |
| Control room | /healthz, /api/metrics, /api/key-status, /api/set-key, /api/saas/* | |
| Save | none in backend | localStorage |

## Taken from the other frontends
- Lovable: Markdown/JSON export. Stitch "governance loop": Agent view. Stitch "render queue / API key": Control room.
- Already present in the base: timeline, compare, command palette (merged from the atelier/cinematic ideas).
