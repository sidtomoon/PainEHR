-- Per-encounter-type fields, informed by the predecessor Google Form
-- ("Unified Longitudinal Pain Registry & CDSS"). That form flattened
-- new/procedure/follow-up visits into one row per entry; here each field
-- group is still columns on `encounters` (kept as one table, not split,
-- since Encounter is already the per-visit entity) but scoped by
-- encounter_type in the application layer instead of one giant form.

create type pain_mechanism as enum ('nociceptive', 'neuropathic', 'nociplastic', 'mixed');
create type imaging_concordance as enum ('concordant', 'discordant', 'not_imaged');
create type goal_of_care as enum ('curative', 'palliative', 'other');
create type procedure_category as enum (
  'diagnostic_block', 'therapeutic_block', 'neurolytic_procedure',
  'neuromodulation', 'other'
);
create type procedure_guidance as enum ('ultrasound', 'fluoroscopy', 'ct', 'blind', 'other');
create type procedure_intent as enum ('diagnostic', 'therapeutic', 'neurolytic');
create type functional_change as enum ('improved', 'static', 'worse');

alter table encounters
  -- New / follow-up assessment
  add column pain_mechanism pain_mechanism,
  add column functional_impact text,
  add column red_flags text,
  add column diagnosis_confidence confidence_level,
  add column imaging_concordance imaging_concordance,
  add column is_cancer_pain boolean,
  add column cancer_type text,
  add column metastatic_disease boolean,
  add column oncologic_treatment text,
  add column goal_of_care goal_of_care,

  -- Procedure visit
  add column procedure_category procedure_category,
  add column procedure_level_laterality text,
  add column procedure_guidance procedure_guidance,
  add column drugs_used text,
  add column procedure_intent procedure_intent,
  add column immediate_pain_relief_nrs int check (immediate_pain_relief_nrs between 0 and 10),
  add column immediate_complications text,
  add column planned_followup_interval text,

  -- Follow-up visit
  add column functional_change functional_change,
  add column reintervention_needed boolean,
  add column learning_point text;
