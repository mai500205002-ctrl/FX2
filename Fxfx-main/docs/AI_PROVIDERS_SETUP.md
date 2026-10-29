# AI Provider Setup

The backend has server-side adapters for Gemini, OpenAI, OpenRouter, and
xAI/Grok. Configure one or more credentials in Codespaces Secrets or the
backend server environment. A configured key is not proof of a working
connection; the provider is live only after a real request succeeds.

## Required secret names

Set any providers you intend to use:

| Provider | Backend secret |
|---|---|
| Google Gemini API | `GEMINI_API_KEY` |
| OpenAI API | `OPENAI_API_KEY` |
| OpenRouter API | `OPENROUTER_API_KEY` |
| xAI / Grok API | `XAI_API_KEY` |

Do not send keys in chat, add them to `.env.example`, frontend variables, source
files, logs, or Git. `.env.example` contains names and non-secret defaults only.

## Provider and model settings

| Setting | Default / behavior |
|---|---|
| `AI_AUTO_PROVIDER_ORDER` | `gemini,openrouter,openai,grok` |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `OPENROUTER_MODEL` | `openai/gpt-4o-mini` |
| `XAI_MODEL` | `grok-3-mini` |
| `*_MODELS` | Optional comma-separated model allow-list for that provider |
| `*_MODEL_CANDIDATE_GENERATION` | Optional task-specific model |
| `*_MODEL_CRITIQUE` | Optional task-specific model |
| `*_MODEL_FINAL_ARTIFACT` | Optional task-specific model |
| `*_MODEL_UTILITY` | Optional task-specific model |
| `AI_TEMPERATURE` | `0.8` (must be between 0 and 2) |
| `AI_MAX_OUTPUT_TOKENS` | `512` |
| `GEMINI_RUN_BUDGET_USD` | `10` process-local estimated run budget |
| `GEMINI_CALL_BUDGET_USD` | `0.5` process-local estimated call budget |

For task-specific model settings, replace `*` with `GEMINI`, `OPENAI`,
`OPENROUTER`, or `XAI`. A requested model must be enabled by the provider's
model list. The frontend cannot submit API credentials.

`OPENROUTER_SITE_URL` is an optional attribution header, not a credential.
Optional `*_INPUT_COST_USD_PER_1K` and `*_OUTPUT_COST_USD_PER_1K` settings
adjust the non-Gemini estimated rates. These budget estimates are not billing
caps, and the in-memory accounting is not shared across backend processes.

## Auto mode and request behavior

Auto selects configured providers in `AI_AUTO_PROVIDER_ORDER`. If a provider
is explicitly selected, the gateway does not silently switch to another
provider. Auto fallback is allowed only after an explicit HTTP 400, 401, 403,
404, or 422 rejection. The gateway does not retry/fallback after timeouts,
network errors, 5xx responses, malformed responses, or cancellation because
the initial provider may have processed and billed the request.

Each outbound call uses an abortable timeout. The gateway validates provider
responses, rejects missing or truncated text, tracks usage/provenance, and
does not expose keys in provider status or request provenance.

## Local setup and validation

1. Copy `backend/.env.example` to a local `backend/.env` if using a local
   environment, then set the provider secrets there. Never commit that file.
2. Install dependencies and start the backend from a clean checkout:

   ```sh
   npm ci
   npm --workspace backend run build
   npm --workspace backend start
   ```

3. Use the application's provider/model selectors or call the backend API
   with a selected provider. A provider is live only when its real generation
   request returns successfully. `/api/health` is not a provider health check;
   the gateway/provider status reports configuration, while call provenance
   records which provider/model actually handled completed calls.

The automated gateway tests use controlled HTTP fixtures, not real provider
accounts. They prove routing and failure handling, not connectivity or model
quality. Browser research is read-only and separate; see the Browser Agent
documentation for its host allow-list and browser setup.
