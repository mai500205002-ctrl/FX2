# TextFX — AI Creative Director (textfx.withgoogle)

## 🎬 **The Concept**

TextFX is a cross-platform (macOS & Windows) **Creative Director AI** that thinks like a seasoned pro. It doesn't generate linear solutions—it applies **lateral thinking** to break conventions and find breakthrough ideas.

**Your workflow:**
1. Write a **Brief** (product, target, challenge)
2. TextFX generates a **Real Insight** (using 5 lateral thinking techniques)
3. Maps it to a **Creative Concept** (cognitive shift + metaphor strategy)
4. Writes a **Production-Ready Script** (3-beat emotional arc)

---

## 🧠 **The 5 Advanced Lateral Thinking Techniques**

### 1. **Provocation (PO)**
Flip the assumption. "If the opposite were true, what would we discover?"
- Problem: "People forget to drink water"
- Provocation: "What if forgetting reveals the real opportunity?"
- Insight: Shift from reminder (annoying) to celebration (irresistible)

### 2. **Analogies** 
Link the product to unrelated domains.
- Water app = Coffee ceremony (ritual) + Luxury perfume (identity) + Strava (achievement)
- Result: 5 different positioning angles from unexpected connections

### 3. **Random Stimulus**
Pick a random word, force a connection.
- Random: "Compass"
- Connection: "Hydration is your internal compass to wellness"
- Angle: "When lost, wellness is always the right direction"

### 4. **Opposite Thinking**
Push to extremes, find the desirable middle.
- Extreme positive: Mandatory celebration
- Extreme negative: Completely voluntary, often forgotten
- Sweet spot: Voluntary yet irresistible, celebrated yet pressure-free

### 5. **Constraint Reversal**
Invert the problem, find hidden opportunity.
- Problem: "People forget to hydrate"
- Reversal: "People already hydrate unconsciously"
- Solution: Don't remind—sync with existing rituals and make them intentional

---

## 🎯 **Quick Start (Windows PowerShell)**

```powershell
# 1. Install dependencies
npm install

# 2. Run dev servers (Backend + UI)
npm run dev

# 3. Open UI in browser
# http://localhost:5173
```

**Backend runs on:** `http://localhost:4000`

---

## 🏗️ **Architecture**

```
textfx/
├── app/                    # React + Vite UI
├── backend/                # Node + Express API
│   ├── modules/
│   │   ├── insight-generator.ts          # 5-technique insight engine
│   │   ├── concept-mapper.ts             # Cognitive shift + metaphor
│   │   ├── script-writer.ts              # 3-beat emotional screenplays
│   │   └── lateral-thinking-agent.ts     # Core 5 techniques
│   └── src/index.ts        # API endpoints
├── docs/                   # Full documentation
│   ├── LATERAL_THINKING_FRAMEWORK.md
│   ├── ADVANCED_LATERAL_THINKING.md
│   ├── PROMPT_TEMPLATES.md
│   └── AR_QUICKSTART.md (عربي)
└── local_models/           # Local LLM setup guides
```

---

## 🚀 **API Endpoints**

### Generate Insight (All 5 Techniques)
```bash
POST /api/insight
Body: { "brief": "Product description and market context" }
```

**Response includes:**
- Main insight from all 5 techniques
- Provocation + reversal
- Analogies from 5 unrelated domains
- Random stimulus + unexpected angle
- Opposite thinking paradox
- Creative breakthrough statement

### Map to Concept
```bash
POST /api/concept
Body: { "insight": "<insight output from above>" }
```

**Response includes:**
- Reframed positioning (cognitive shift)
- Central metaphor (creative device)
- Emotional arc
- Visual notes
- Target paradox

### Write Script
```bash
POST /api/script
Body: { "concept": "<concept output from above>" }
```

**Response includes:**
- 30-second screenplay (3 emotional beats)
- Camera language + narrative strategy
- Emotional turning point for viewer

### Full Pipeline (Brief → Insight → Concept → Script)
```bash
POST /api/full-pipeline
Body: { "brief": "..." }
```

---

## 📚 **Documentation**

- **`docs/LATERAL_THINKING_FRAMEWORK.md`** — Core philosophy (philosophy + 4 basic techniques)
- **`docs/ADVANCED_LATERAL_THINKING.md`** — The 5 advanced techniques (Provocation, Analogies, Random, Opposite, Reversal)
- **`docs/PROMPT_TEMPLATES.md`** — System prompts for Google Vertex AI, OpenAI, local LLMs
- **`docs/AR_QUICKSTART.md`** — Quick start in Arabic (عربي)

---

## 🤖 **Next Steps**

### Option A: Connect Real AI
Add Google Vertex AI or OpenAI API keys to unlock **real creative generation**:

```bash
export VERTEX_API_KEY=<your-key>
export OPENAI_API_KEY=<your-key>
```

See `docs/PROMPT_TEMPLATES.md` for integration code.

### Option B: Local LLM
Run a local model (text-generation-webui, llama.cpp) for **offline creativity**:

See `local_models/README.md` for setup.

### Option C: Electron Desktop App
Package as macOS (.dmg) and Windows (.exe) desktop app:

```bash
npm run build
```

---

## 💡 **Example: Water Reminder App**

### Input Brief
```
Product: Water reminder app + smart bottle
Target: Urban professionals, 25-40
Challenge: People know water is important but forget in daily rush
Goal: Make hydration irresistible
```

### Output Pipeline

#### 1. Insight (5 Techniques)
- **Provocation:** Reminders aren't the problem—invisibility is
- **Analogies:** Like coffee ritual, luxury item, fitness achievement, meditation
- **Random (compass):** "Hydration is your internal compass to wellness"
- **Opposite:** Make voluntary yet inevitable, celebrated yet pressure-free
- **Reversal:** People already hydrate—just make it visible and intentional

#### 2. Concept (Cognitive Shift)
```
From: "Health app"
To: "Ritual anchor for self-love"

Tagline: "One sip. You choose yourself."
Creative Device: Hydration as compass, pulse, high-five to yourself
Paradox: Make choosing yourself feel like you have no choice
```

#### 3. Script (3-Beat Story)
```
INT. EARLY MORNING
[RECOGNITION] Hand reaches for water. Not a tool—a choice.

CUT TO: Water pours. Light catches it—ethereal.
[SURRENDER] "One sip. You choose yourself."
Person drinks. Everything shifts internally.

[ARRIVAL] The moment ends. Everything changed.

SUPER: "[Brand]. One sip. You choose yourself."
```

---

## 🎓 **Philosophy**

TextFX is built on this principle:

> **Creativity isn't about more ideas. It's about BETTER questions.**
> 
> Instead of "How do we remind people?" ask "How do we make forgetting impossible by making remembering irresistible?"
>
> Instead of selling features, sell the transformation.
> Instead of solving the problem, reframe it as an opportunity.

---

## 🛠️ **Tech Stack**

- **Frontend:** React 18, Vite, TypeScript
- **Backend:** Node.js, Express, TypeScript
- **Desktop:** Electron (scaffolded, ready to implement)
- **AI Providers:** Google Vertex AI, OpenAI, Local LLMs
- **Build:** Electron-builder (macOS + Windows)

---

## 📖 **For Copywriters**

TextFX is built FOR you. It's designed to work like a Creative Director partner:

1. **Faster ideation** — 10 minutes instead of hours
2. **Breakthrough insights** — Using proven lateral thinking techniques
3. **Professional output** — Scripts ready for production
4. **Iteration** — Quickly test different approaches
5. **Brand consistency** — Add brand voice profiles and templates

---

## 🌍 **Multilingual Support**

- English: Full documentation and UI
- Arabic: `docs/AR_QUICKSTART.md` + UI translations (in progress)

---

## 📄 **License**

Open for creative use. Designed to empower copywriters and creative teams.

---

## 🔗 **Resources**

- Edward de Bono — "Lateral Thinking" (foundational)
- John Hegarty — "Hegarty on Advertising" (creative philosophy)
- Simon Sinek — "Start With Why" (emotional positioning)
- David Ogilvy — "Ogilvy on Advertising" (timeless principles)

---

**TextFX:** Where creative directors and AI think together. 🚀

## Creative Core Increment 13 — Controlled Evaluation

Increment 13 adds a two-step blind-review experiment workflow. From `backend/`, prepare a randomized blind packet and a separate confidential version mapping using `scripts/creative-experiment-orchestrator.cjs`. Share only the packet with reviewers. After ratings are finalized, apply the mapping and pass the result to the existing Creative Quality Lab report tool. See `docs/CREATIVE_CORE_INCREMENT13.md` for commands, schema, and guardrails.

The orchestrator requires paired benchmark cases across versions and does not call AI services or change generation policy. Reviewer blinding and independence still require human process controls. Full TypeScript build remains unverified until backend dependencies and Node type definitions are installed.


### Increment 14: Experiment Integrity & Reviewer Agreement
- Prepare blind packets with a hash-backed manifest; keep the private version mapping separate.
- Run `npm run agreement:report -- --ratings finalized-ratings.json --out agreement-report.json` to inspect reviewer agreement and disagreement alerts.
- During finalization, optionally pass `--packet blind-packet.json --manifest blind-packet.json.manifest.json` to verify integrity before unblinding.


### Increment 15: Evidence-gated policy review
Generate a review dossier from a Quality Lab report, an inter-rater agreement report, and integrity-verified finalized ratings:

```bash
npm run policy:review -- --quality quality-report.json --agreement agreement-report.json --ratings finalized-ratings.json --out policy-dossier.json
```
The dossier is advisory-only. It never changes TextFX generation policy automatically.


### Increment 16: Human trial governance
Record a decision after reviewing the policy dossier:

```bash
npm run trial:governance -- record --dossier policy-dossier.json --decision defer --approver reviewer-board --rationale "Need another benchmark run before making a decision." --ledger decisions.json
npm run trial:governance -- verify --ledger decisions.json
```
For `approve`, also provide `--trial-window "20 runs maximum"` and `--rollback-file rollback-criteria.json` (an array of at least two explicit stop conditions). This creates an audit record only; it does not alter generation behavior.


### Increment 17: Creative run provenance
Include an optional `provenance` object in each entry of the artifacts input. Supported fields: `modelProvider`, `modelId`, `promptTemplateHash` (SHA-256), `generationConfigHash` (SHA-256), `sourceRevision`, `temperature`, `topP`, and `seed`. Do not include credentials or arbitrary metadata.

```bash
npm run provenance:audit -- --ratings finalized-ratings.json --baseline v1 --candidate v2 --out provenance-report.json
```
The report makes missing/different configurations visible; it does not claim causality.


### Increment 18: Repeated-run stability
Combine finalized ratings from multiple independent runs (keep artifact IDs unique), then run:

```bash
npm run stability:report -- --ratings combined-finalized-ratings.json --baseline v1 --candidate v2 --out stability-report.json --min-repeats 3
```
The analyzer reports within-version variability and only compares benchmark cases with enough complete repeats for both versions. Do not duplicate the same artifact to fake repeated runs.


## Increment 19 — Browser Agent v1 (local read-only research)

This increment adds a real Playwright/Chromium reader, an Arabic/English panel, immutable completed research snapshots, and explicit attachment of unreviewed references to the existing creative Agent. It is not a general-purpose autonomous browser or an implementation of the entire proposed v2 architecture.

### Install and run

Use **npm at the repository root** with the new `package-lock.json`. The older workspace pnpm locks are retained from Increment 18 and were not regenerated for this feature.

```bash
npm ci
npm run browser:install --workspace=backend
npm run build --workspace=backend
```

Copy `backend/.env.example` to `backend/.env` and configure:

```dotenv
TEXTFX_BROWSER_ENABLED=true
TEXTFX_BROWSER_ALLOWED_HOSTS=example.com
TEXTFX_BROWSER_TOKEN=<random-secret-at-least-32-characters>
```

Generate a token locally, do not use the literal placeholder, and never put it in `VITE_*` variables:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run dev
```

On Linux, Chromium may need OS libraries: use the official Playwright installation guidance at https://playwright.dev/docs/browsers#install-system-dependencies. The Chromium sandbox remains enabled; unsupported deployment environments fail closed rather than adding `--no-sandbox`. On Windows, install Chromium under the account that runs the Node backend. **The existing pkg/Electron Windows installer has NOT been rebuilt or verified with Playwright**; the verified path for this increment is the Node backend plus Vite frontend. Chromium binaries and node_modules are not bundled in this source archive.

In the Browser Agent panel, enter the token, a goal and up to three HTTPS URLs. Each host must match the server allowlist exactly. Read the excerpts, export JSON if needed, then explicitly attach the saved research to the next **Agent + SaaS Control Room → Run Agent** execution. This does not attach it to the separate brief/insight buttons. The token stays only in React memory. Do not provision/select a SaaS tenant for an attached-browser run: tenant IDs in the existing application are not authenticated isolation.

The browser itself makes **zero LLM calls**. When explicitly attached, excerpt data is passed at the user/data level to planning and stages using the runtime provider, not as system instructions. The initial insight generator retains its original path and does not receive these browser excerpts. Final evaluation cannot become `ready` solely on the strength of those unreviewed sources: the result remains at least `needs-review`, while an existing `blocked` verdict remains blocked. Provenance stores the research ID and evidence IDs. Model tokens for attached excerpts are still governed by the existing gateway, which is **not yet an atomic monetary reservation system**.

### HTTP contract

All `/api/browser` routes require `Authorization: Bearer <token>`, including status and deletion. The feature is disabled unless opt-in, an exact-host allowlist, and a sufficiently long token are configured.

- `GET /api/browser/status` — mode, operator allowlist and limits.
- `POST /api/browser/research` — JSON `{ "goal": "Read product information", "urls": ["https://example.com/"] }`.
- `GET /api/browser/runs/:runId` — restore a completed snapshot, without navigation or model calls.
- `DELETE /api/browser/runs/:runId` — delete that local research snapshot. This does not delete references copied into creative results, backups, JSON downloads or external logs.
- `POST /api/agent/run` — optional `browserResearchId`; requires the same browser token and rejects tenant-associated attachments.

No routes accept arbitrary browser actions, JavaScript, selectors, cookies, user-controlled allowlists, downloads, login or publication. A failed or partial research result is explicitly labelled, not silently substituted with invented content.

### Boundaries and security

Only credential-free HTTPS domain URLs on port 443 are supported. Query strings, direct IPs, redirects, non-public DNS answers, binary files and compressed responses are refused. DNS answers are checked for both IPv4 and IPv6; HTTPS connects to the validated IP while retaining Host/SNI and TLS certificate validation. No second unchecked DNS lookup occurs. A fresh Chromium context disables page JavaScript, service workers and downloads. All subresources and follow-up navigations are blocked; the single allowed document is fulfilled through the pinned transport. This intentionally means many JavaScript-only, authenticated or redirect-heavy websites will not work. There is no search-provider integration, crawling or clickable autonomous loop in v1.

Per-run caps: three supplied pages, one active browser run per backend process, one document request per supplied page, 1,000,000 response bytes per page, 12,000 stored text characters per page, an 8-second HTTP inactivity timeout and a 45-second browser-run deadline. The process-local reservation is not a distributed quota. The deadline aborts network activity and closes Chromium; snapshot persistence/OS cleanup is outside a strict wall-clock SLA.

Each excerpt has its URL, retrieval time, text SHA-256, response-body SHA-256, truncation flag, and explicit `untrusted-web-content` / `unreviewed` labels. Hashes detect accidental snapshot changes; they are not digital signatures or proof that a claim is true. Complete HTML is not retained; `responseBodyHash` fingerprints the fetched bytes while only the bounded extracted text is saved.

Completed snapshots live by default in `.textfx/browser-research` under the current user's home, configurable with `TEXTFX_BROWSER_DATA_DIR`. They are created exclusively and cannot silently overwrite an earlier snapshot. Restoring a **completed** snapshot is supported; crash recovery of an **in-progress** browser job is not implemented. Events in the snapshot are a local trace, not a transactional event store/outbox. Deletion/retention must be managed by the operator; no automatic retention policy is enabled.

This is **local single-user software, not production multi-tenant SaaS**. Existing Agent/SaaS endpoints still need real authentication, authorization and durable tenant isolation. Network egress policy/container isolation remains recommended defense in depth. No browser content can grant itself tool permissions, lift the allowlist or approve publication. Instruction framing reduces prompt-injection exposure but does not prove semantic immunity; review remains mandatory.

### Verification of this delivery

- Backend TypeScript compilation passed.
- All **71/71** backend tests passed (47 inherited + 24 added), including URL/IP policy, DNS pinning, redirects, byte limits, token-gated API, immutable restoration, corruption detection, concurrent slot reservation and reference provenance/review behavior.
- Frontend TypeScript checking and production Vite build passed.
- A one-time live Chromium capture of `https://example.com/` succeeded with the Chromium sandbox enabled.
- An Arabic UI end-to-end check exercised live capture, attachment request, restore and deletion without JavaScript page errors. The creative generation response in that UI check was mocked; no live Gemini-quality or full campaign approval claim is made.
- No Windows executable/installer, production tenancy, monetary-budget concurrency, general event replay, legal claim approval or unattended publishing is certified by this verification.

Security references: https://playwright.dev/docs/network and https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
