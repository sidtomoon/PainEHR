# PainEHR — Version 2 Scope Note

Drafted 2026-09-01. Companion to the original [project brief](.) and the v1 build in `painehr/`. This is a proposal to review, not something already built — nothing here has been migrated into the live schema yet.

## Why this document exists

Two requests came in together: (1) make the data model good enough that encounters can support **prospective and retrospective pain-medicine research**, not just day-to-day charting, and (2) add **appointment scheduling + WhatsApp Business reminders/announcements**. Both are real scope expansions beyond the v1 brief's "narrow slice" — worth designing deliberately rather than bolting on ad hoc, especially since research-grade data collection and patient messaging both raise the governance/consent bar already flagged for this project.

---

## Part 1 — Research-grade data model

### What the literature actually says to collect

According to PubMed, the IMMPACT consensus group's foundational recommendation (Turk et al., 2003) is that chronic pain trials should assess six core domains: (1) pain, (2) physical functioning, (3) emotional functioning, (4) patient ratings of improvement/satisfaction, (5) symptoms and adverse events, (6) participant disposition — [DOI](https://doi.org/10.1016/j.pain.2003.08.001). A 2021 update (Patel et al.) reviews how measurement of these domains has evolved and where gaps remain — [DOI](https://doi.org/10.1097/PR9.0000000000000784).

Closer to our exact use case, the **PRECISION Pain Research Registry** — a real, actively-published chronic pain registry run by osteopathic physicians in the US — collects, at each quarterly encounter: pain intensity (0–10 NRS), the **NIH Minimum Dataset for Chronic Low Back Pain** pain-impact score, the **Roland-Morris Disability Questionnaire** for back-related disability, **PROMIS-29** for physical function/anxiety/depression/fatigue/sleep/social participation/pain interference, and a single widespread-pain screening item from the NIH Task Force's minimum dataset (Licciardone et al. — [DOI](https://doi.org/10.1515/jom-2022-0212), [DOI](https://doi.org/10.3122/jabfm.2020.04.190456), [DOI](https://doi.org/10.1515/jom-2021-0113), [DOI](https://doi.org/10.1515/jom-2021-0105)). This is the most directly applicable precedent we found: it's an existing chronic-pain OPD registry, not just a trials methodology paper.

For the cancer/palliative-pain side of this practice, a consensus core outcome set for cancer survivorship research (Ramsey et al., 2020) recommends: depression, anxiety, pain, fatigue, cognitive problems, fear of recurrence/progression, functioning in everyday roles, financial toxicity, coping, overall symptom bother, overall quality of life, overall health status — [DOI](https://doi.org/10.1007/s11764-020-00924-5).

General methodology background on why core outcome sets matter for comparability and pooling: Chiarotto et al. — [DOI](https://doi.org/10.1016/j.bjpt.2017.03.001).

### The gap between that and our current schema

We already capture pain intensity (NRS), pain location, pain mechanism, diagnosis, diagnosis confidence, imaging concordance, and (for procedures) immediate pain relief. We do **not** currently capture, in any structured way:

- Physical function / disability (we only have a free-text `functional_impact`)
- Emotional functioning (mood/anxiety) — nothing
- Sleep — nothing
- Patient-reported global impression of change — we have a *clinician*-rated `functional_change` enum (improved/static/worse), which is not the same thing and isn't patient-reported
- Overall quality of life — nothing
- Widespread-pain screening — nothing
- Adverse events as a general concept — we only track `immediate_complications` on procedure visits, not across encounter types (IMMPACT's domain 5 is not procedure-specific)

### Proposed v2 additions (pragmatic single-item versions, not full instruments)

A solo OPD visit can't realistically administer a 10-item PROMIS form per patient per visit. The proposal is to add **brief, single-item proxies** for each missing domain — enough to compute before/after change and to filter cohorts, without turning every visit into a research questionnaire. These would live as new nullable columns on `encounters`, filled in at review time same as existing fields:

| Field | Type | Collected at | Rationale |
|---|---|---|---|
| `function_score_0_10` | int 0–10 | every encounter | proxy for physical functioning; single-item alternative to RMDQ/ODI |
| `mood_score_0_10` | int 0–10 | every encounter | proxy for emotional functioning |
| `sleep_score_0_10` | int 0–10 | every encounter | matches PROMIS-29 sleep-disturbance domain used in PRECISION registry |
| `qol_score_0_10` | int 0–10 | every encounter | overall quality of life, cited in both IMMPACT and cancer survivorship COS |
| `widespread_pain` | boolean | new/followup | single screening item, per NIH Task Force minimum dataset |
| `patient_global_impression` | enum: much_worse/worse/no_change/better/much_better | followup only | patient-reported, distinct from the clinician-rated `functional_change` already in schema |
| `adverse_event` | text, nullable | every encounter | generalizes today's procedure-only `immediate_complications` to IMMPACT's domain 5 |

If real validated multi-item instruments (RMDQ, PROMIS short forms, ODI) are wanted later for publication-grade rigor, that's a bigger lift — it needs a patient-facing intake step (tablet/kiosk at check-in), not clinician-typed fields — and should be a separate v3 conversation, not bundled here. Note also that ODI carries some licensing restrictions depending on use; PROMIS instruments are NIH-funded and free to use; RMDQ is free for non-commercial clinical/research use — worth confirming licensing before committing to any specific copyrighted instrument if this ever becomes a multi-site or published study.

### Diagnosis coding

Free-text `diagnosis` blocks reliable cohort definition at scale (this is literally the predecessor spreadsheet's failure mode, just at the diagnosis field instead of pain location). A structured code — ICD-11's chronic pain classification (MG30 codes) or ICD-10 — paired with the existing free-text field would let "all trigeminal neuralgia patients" become a real query instead of a string search. Proposed as a `diagnosis_code` nullable text column now (so the field exists), with a proper coded lookup/autocomplete deferred to whenever a v2 build actually happens — needs picking a code system and possibly a reference table.

### Research consent and export, not just data capture

Two structural pieces the field list above doesn't solve on its own:

1. **Research consent as a first-class flag.** Clinical treatment consent and research-use consent are different things. Add `research_consent` (boolean, nullable) and `research_consent_date` to `patients`, defaulting to null/not-consented. Any cohort export or study query should filter on this — it's the mechanism that makes "this data can be used for a retrospective study" actually true rather than aspirational. This is also where the DPDP Act angle already flagged in [project governance](.) becomes concrete: consent has to be captured before data is used for research, not assumed.
2. **A real export view, computed correctly.** The predecessor spreadsheet's `LATEST_STATUS` and `RESPONDER_TRAJECTORY` sheets were formulas bolted onto a flat sheet, and were already broken (empty cells) by the time it was reviewed. In the new schema, "responder status," "% improvement from baseline," and "latest status" should be Postgres views computed from real joins across `patients`/`encounters` — e.g. a view that finds each patient's first and most recent NRS/function/mood scores and computes delta and percent change server-side. This replaces spreadsheet formula rot with something that's actually correct, and can be exported straight to CSV for R/SPSS/Python.

---

## Part 2 — Appointments + WhatsApp Business messaging

The `appointments` table (patient, type, scheduled date, status, reminder tracking) already exists and is live — built this session. What's not built is the messaging layer, because it needs decisions and an external account only you can create:

### Decision 1 — Which WhatsApp path

| Option | What it involves | Tradeoff |
|---|---|---|
| **Meta Cloud API direct** | Meta Business Manager + WhatsApp Business Platform app, business verification (KYB), your own phone number | Free per-conversation-window pricing, but you own the Meta verification process and template management directly |
| **BSP (Twilio / Gupshup / 360dialog, etc.)** | Sign up with the BSP, they handle Meta onboarding for you | Faster to get running, small per-message markup, one more vendor in the chain |

Either way, **reminders are "utility" template messages** that must be pre-approved by Meta before they can be sent, and **outbound business-initiated messages require patient opt-in** under WhatsApp's own platform policy — separate from and in addition to DPDP consent.

### Decision 2 — Consent mechanism

Given the [governance gate](.) already on this project (no real patient data until institutional/consent/DPDP clearance), a WhatsApp opt-in should probably be captured at the same time as that broader consent — e.g. a `whatsapp_opt_in` boolean on `patients`, set only after the patient has explicitly agreed to receive appointment reminders on that channel. Until that's designed, the reminder system should not send anything to real patients — synthetic-data testing only, consistent with the existing governance rule.

### Proposed technical shape (once the above is decided)

- A scheduled job (Supabase `pg_cron` + Edge Function, or a Vercel Cron hitting a Route Handler) runs daily, queries `appointments` where `scheduled_date` is N days out, `status = 'scheduled'`, `reminder_sent_at is null`, and the patient has opted in.
- Sends a pre-approved WhatsApp template message per matching row, then stamps `reminder_sent_at`.
- A separate **announcements** feature (doctor unavailability, clinic relocation, etc.) is a different shape — not tied to an appointment, more like "compose a message, pick an audience (all opted-in patients, or a filtered subset), send, log delivery." Worth its own small `announcements` + `announcement_recipients` table pair when it gets built, so delivery status per patient is tracked rather than fire-and-forget.

### What this needs from you before any of it gets built

1. Pick Meta direct vs. a BSP (Twilio is the easiest on-ramp if you want the fastest path).
2. Create that account yourself (account creation isn't something I can do on your behalf).
3. Decide how/when WhatsApp opt-in gets captured from patients — a paper form at first visit, a checkbox during onboarding, a verbal-consent-logged-by-clinician workflow, etc.
4. Confirm reminder message wording — Meta's template approval is picky about phrasing, especially for anything touching health information.

---

## Suggested sequencing

1. Research-grade fields (Part 1's table) — straightforward schema + form work, no external dependency, can happen anytime you approve the field list.
2. Research consent flag + the computed export view — same, no external dependency.
3. WhatsApp — blocked on decisions 1–4 above; once resolved, the appointments table this session already built is ready to be the query source for the reminder job.

Nothing here is committed yet — this is the plan to react to, not a fait accompli.
