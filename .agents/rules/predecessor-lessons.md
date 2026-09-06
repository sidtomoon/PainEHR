# Predecessor system — concrete failure modes to design against

A prior Google Forms/Sheets registry ("Pain Registry VS OPD" / "Unified Longitudinal Pain Registry & CDSS") was reviewed for its actual failure modes before this project's schema was designed. Keep these in mind — they're not hypothetical:

- **A single long branching form flattened into one CSV row per entry** caused columns to misalign across entry types — a "new patient" row and a "procedure" row don't share a column shape, so exported data was a mess to parse. This is why `encounters` uses per-encounter-type structured fields in a normalized table rather than one giant form.
- **No enforced Patient ID format** — encounters for the same patient weren't reliably linkable across visits. `patients.patient_code` is a sequence-backed, enforced format (`PT-000001`) for exactly this reason.
- **Mixed data types inside single fields** (e.g. age recorded as "40/M" in one row, a plain number in another). Every field in this schema is typed and single-purpose.
- **Free text used where controlled vocabulary was needed** (pain location, diagnosis) — blocked reliable cohort queries later. See `data-model-decisions.md` for which fields are enums as a direct result.
- **Longitudinal views (timeline, latest status, responder trajectory) were hand-built with spreadsheet formulas** bolted onto the flat sheet, and were already silently broken (empty computed cells) by the time they were reviewed. This project computes the equivalent (`patient_outcomes_summary`) as a real Postgres view with `security_invoker = true` (so it still enforces RLS), not a formula layered on top of an export.
