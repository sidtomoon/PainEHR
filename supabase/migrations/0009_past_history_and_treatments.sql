-- Migration 0009: Past Medical/Surgical History & Past Treatments
alter table encounters add column if not exists past_history text;
alter table encounters add column if not exists past_treatments text;
