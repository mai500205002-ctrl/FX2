# TextFX Creative Core — Increment 11

## Mocked End-to-End Pipeline Tests + Human-Scored Creative Benchmark

### What changed

- Added `runAgentWithDependencies()` as a narrow dependency-injection seam for deterministic tests. Production `runAgent()` continues to use the real provider and real stage implementations.
- Added `backend/tests/agent-pipeline.test.cjs`, exercising the orchestration from planning through insight, discovery, metabolism, entropy regulation, Creative Court, script generation/revision, counterfactual replay, learning, evaluation, and CreativeIR assembly.
- Tests cover successful completion, the one-revision limit, bounded shadow generation/review, and non-fatal shadow failure.
- Test provider explicitly throws if called, preventing accidental live model calls in the mocked pipeline tests.
- Added `backend/tests/fixtures/creative-benchmark.json`, a versioned set of five stable creative briefs and a blind human-scoring protocol. It deliberately does not assign automatic “ground truth” artistic scores.
- Added regression expectations for the rule that counterfactual evidence must not silently replace the selected creative artifact.

### Validation performed

- The Node test suite passed **10/10 tests** using the available compiled JavaScript and deterministic mocks.
- A full TypeScript build was attempted but remains blocked by missing installed dependencies and Node type declarations (including `@google/genai`, `express`, and `@types/node`). A successful transpilation of the edited orchestration file is not equivalent to a full typecheck/build.

### What this establishes—and what it does not

These tests establish selected orchestration contracts under mocked stages. They do not verify live provider integration, production environment behavior, or artistic effectiveness. The benchmark needs real generated artifacts, blind reviewers, repeated runs, and inter-rater agreement analysis before it can support quality-improvement claims.

### Run

From `backend/`, after installing the declared dependencies:

```bash
npm test
```

For tests against existing compiled output only:

```bash
npm run test:unit
```
