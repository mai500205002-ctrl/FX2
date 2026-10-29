# AI Connectors

The backend gateway has server-side adapters for Google Gemini, OpenAI,
OpenRouter, and xAI/Grok. The default models are `gemini-3.1-flash-lite`,
`gpt-4o-mini`, `openai/gpt-4o-mini`, and `grok-3-mini`, respectively.
Implemented adapters are not evidence of a live connection: each provider must
be tested with a valid server-side key before claiming it is operational.

## Credentials and model selection

Configure one or more of these environment variables in the backend process or
Codespaces Secrets:

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `XAI_API_KEY`

Never put keys in frontend code, `VITE_*` variables, source files, logs, or
commits. The API status endpoint reports whether a provider is configured, not
whether its credentials have been validated by a successful request.

The UI can select `auto` or one configured provider and can select a model that
the server advertises. `*_MODEL` chooses each provider's default model;
`*_MODELS` optionally restricts the allowed model IDs. Task-specific model
variables support candidate generation, critique, final artifact, and utility
calls. See [`AI_PROVIDERS_SETUP.md`](./AI_PROVIDERS_SETUP.md) for all variable
names and the Auto fallback policy.

## Safety and operational limits

- Auto uses `AI_AUTO_PROVIDER_ORDER` (default: `gemini,openrouter,openai,grok`).
- No automatic retry is made after a request. Auto proceeds to another provider
  only for explicit 400, 401, 403, 404, or 422 rejections. Timeouts, network
  failures, 5xx responses, malformed responses, and cancellation do not trigger
  fallback because the first provider may already have incurred a charge.
- Requests have an abortable timeout. Cost budgets are process-local estimates,
  not provider-side spending limits; OpenAI-compatible provider rates are
  approximate unless configured.
- The default adapters use Gemini's REST API and OpenAI-compatible chat
  completions for OpenAI, OpenRouter, and xAI. Vertex AI and local LLM adapters
  are not included.

## Validation

Gateway tests use controlled HTTP fixtures; they verify request routing,
response parsing, cancellation, and fallback policy, but do not prove provider
availability. A live provider check requires a valid key and a successful
request to that provider. Browser research is a separate read-only capability
and does not use a model during retrieval.
