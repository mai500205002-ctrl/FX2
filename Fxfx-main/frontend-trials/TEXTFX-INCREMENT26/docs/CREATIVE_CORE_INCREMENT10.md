# TextFX Creative Core — Increment 10

## Automated Regression & Evaluation Framework

### What changed

- Added a Node.js built-in test suite under `backend/tests/creative-core.test.cjs`.
- Added deterministic regression contracts under `backend/tests/fixtures/creative-regression-cases.json`.
- Tests cover Counterfactual Replay runner-up selection, model-vs-fallback evidence handling, CreativeIR schema rejection, and the durable-memory persistence path.
- Added `npm test` (`npm run build` followed by the tests) and `npm run test:unit` (runs tests against the existing compiled `dist` files without rebuilding).
- Uses Node's built-in `node:test` and `node:assert/strict`; no test framework dependency is added.
- Tests write memory state to an isolated OS temporary directory and clean it up afterward; they do not touch the normal project memory file.

### What these tests establish—and what they do not

These are deterministic regression tests of software contracts and orchestration safeguards. They do **not** prove that generated ideas are original, that a script will succeed with an audience, or that model quality improves over time. Those claims require a curated creative benchmark, repeatable model/provider settings, and ideally blinded human or audience evaluation.

### Running

From `backend/` after installing dependencies:

```bash
npm test
```

For tests against already-built JavaScript only:

```bash
npm run test:unit
```

`npm test` intentionally fails if the TypeScript build fails; do not treat a test run against stale `dist/` files as a successful source build.

### Remaining limitations

- The current environment used to prepare this archive does not have all backend dependencies/type definitions installed, so a clean TypeScript build and the full `npm test` pipeline could not be certified here.
- The test suite is intentionally small and deterministic. Next steps should add integration tests for the complete `agent-service` run with mocked provider boundaries, plus a versioned creative-quality benchmark scored by blinded human reviewers.
