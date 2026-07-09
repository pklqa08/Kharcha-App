# Kharcha Master Prompt

Central prompt and workflow guidance for Copilot-driven development.

## Purpose
- Maintain consistent implementation quality across frontend and backend.
- Capture project conventions, constraints, and review criteria.
- Route task-level prompts into `prompts/`, final outputs into `completed/`, and feedback into `reviews/`.

## Usage
1. Start each development task from this baseline.
2. Add task-specific instructions in `prompts/`.
3. Move finalized prompt/result pairs to `completed/`.
4. Log review notes and defects in `reviews/`.

## Guardrails
- Keep the app offline-first by default.
- Preserve clear separation between `frontend/` and `backend/` responsibilities.
- Prefer incremental, testable changes.
- Document architectural impacts in `development/architecture/`.
