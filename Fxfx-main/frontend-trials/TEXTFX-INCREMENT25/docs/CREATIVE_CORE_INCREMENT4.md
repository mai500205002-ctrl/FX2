# TextFX Creative Core — Increment 4

## Purpose

Increment 4 extends the existing creative pipeline with an independent review of the finished script and one bounded, feedback-driven revision. It preserves the existing generator and response fields rather than replacing the project architecture.

## Added

- `backend/src/modules/creative-reviewer.ts`: evaluates the generated script against the goal, brief, insight, and approved concept.
- Six explicit criteria: goal alignment, originality, emotional arc, visual specificity, clarity/pacing, and concept integrity.
- Validated review output with strengths, weaknesses, actionable revision notes, overall score, and verdict.
- One targeted rewrite when a model-based review does not return `ready`; the revised script is reviewed once more. The loop is deliberately bounded to avoid unbounded generation.
- Explicitly labelled structural fallback if the reviewer fails. Fallback scores must not be interpreted as semantic quality judgments.
- `CreativeIR.scriptReview`, review events in lineage, and trace events for review/revision decisions.
- Final evaluation now derives its score and verdict from the independent review rather than awarding points primarily for fields being present.

## Pipeline

1. Generate the first script draft.
2. Independently review the draft against the creative brief and approved concept.
3. If a model-based review does not pass, perform one targeted revision using the reviewer's notes.
4. Review the revised draft once; record the final result even if it still needs human review.
5. Derive the final evaluation and store review provenance in `CreativeIR`.

## Deliberate limitations

- This is not a guarantee of creative quality; model review is a judgment signal, not audience testing.
- At most one revision is attempted in this increment.
- The fallback is structural and explicitly labelled; it cannot substitute for independent semantic review.
- Full TypeScript build has not been confirmed in the current environment because backend dependencies and Node type definitions are absent. The `tsc --noEmit` attempt reported missing dependencies/types, so this increment must be built and exercised after installing the project's locked dependencies.
