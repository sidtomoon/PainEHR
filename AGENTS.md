<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PainEHR

A personal-use patient registry for a solo pain-medicine physician (anesthesiologist / pain & palliative care). Voice or photo capture of a clinical note → AI-drafted structured fields → clinician verification → saved to the patient's longitudinal record.

**Before making changes, read `.agents/rules/*.md`** — they carry the governance gate, established data-model decisions, and lessons from a predecessor system's real failure modes that this project is designed against. Also read `V2_SCOPE.md` and `V3_CLINIC_OPERATIONS_AND_CDSS.md` at the repo root — both are proposals/plans, not fully implemented, but record real design decisions and research (PubMed-cited) already done. Don't re-derive that research from scratch.

Stack: Next.js 16 (App Router) + Supabase (Postgres/Auth/Storage) + Claude API for extraction. `reference/painehr-v1.jsx` is the original client-side prototype this was ported from — useful for UI/logic reference, not something to paste in unchanged.

