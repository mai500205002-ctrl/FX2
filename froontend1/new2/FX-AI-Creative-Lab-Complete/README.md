# FX AI Creative Lab — Unified Web Project

A single web-only workspace assembled from the supplied FX backend, the existing TextFX web UI and prompt documentation, plus Stitch and alternate frontend projects preserved as references. Desktop/Electron and native mobile packaging are intentionally excluded from the runnable app.

## Main runnable app

- `app/`: React + Vite web UI, bilingual Arabic/English, RTL/LTR, Brief → Insight → Concept → Script.
- `backend/`: TypeScript + Express API, five lateral-thinking engines, AI provider gateway, concept mapper, script writer, metrics and optional agent/SaaS routes.
- `docs/PROMPT_TEMPLATES.md`: prompt templates for insight, concept and script.
- `docs/AI_CONNECTORS.md`, `docs/AI_PROVIDERS_SETUP.md`: provider setup and connector notes.
- `docs/EXAMPLE_FULL_OUTPUT.md`: end-to-end output example.
- `design-references/`: Stitch screens and HTML/PNG visual references.
- `reference-projects/`: alternate UI/production prototypes preserved for component and design reuse; these are references, not separate apps to run as the main product.

## Run locally

Requires Node.js 18+ and npm 9+. From this directory:

```bash
npm install
cp backend/.env.example backend/.env
# Put your chosen provider key in backend/.env (OpenRouter, OpenAI, or Vertex).
npm run dev
```

Frontend: `http://localhost:5000`  
Backend health: `http://127.0.0.1:3001/healthz`

On Windows PowerShell, copy `backend/.env.example` to `backend/.env` manually if `cp` is unavailable. Keep real API keys out of Git.

## Integration notes

The canonical UI is the supplied TextFX web frontend because its stage payloads align with the backend's `/api/insight`, `/api/concept`, and `/api/script` routes. The separate `fx-creative-platform-frontend-main` and `fx-creative-muse-main` projects are retained under `reference-projects/` for later design/component migration, rather than mixed into the runtime bundle.

Audit fixes included in this bundle: load `backend/.env`, honor `PORT`, allow OpenRouter to activate real-AI mode in the context builder, serialize structured insight/concept objects before sanitization and policy checks, align the backend env template with the actual port/CORS variable, and remove the broken `no-cors` JSON check.

## Verification status

This bundle has been assembled and statically patched. It has **not** had `npm install`, TypeScript compilation, a Vite production build, or live API integration tests run in this environment. Run `npm install` and `npm run build` before treating it as verified. Provider calls require a valid API key; without one, the backend may use its built-in fallback/mock logic.
