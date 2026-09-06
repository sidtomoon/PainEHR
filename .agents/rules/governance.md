# Governance — do not skip this

PainEHR will eventually hold real patient PHI, processed through a third-party AI (Claude API), stored outside any hospital-approved EHR. Before any real (non-synthetic) patient data goes in:

- Confirm this is permitted under the treating institution's data governance / IT policy.
- If it's going to support outcome/responder research, have a real consent mechanism in place (`research_consent` / `research_consent_date` columns already exist on `patients` for this).
- Treat India's DPDP Act 2023 obligations for sensitive personal (health) data as applicable, including third-party processing by an LLM API.
- Use synthetic or de-identified test patients for all development and testing until the above is settled.

This gate is **not yet cleared** as of the last update to this file. Default to synthetic/de-identified data in any example, seed script, test fixture, or demo. If asked to load or reference real patient data before this gate has been explicitly confirmed cleared by the user, say so rather than proceeding silently.

WhatsApp messaging (see `V2_SCOPE.md`) adds a second consent layer on top of this: outbound business-initiated WhatsApp messages need the patient's own opt-in (`whatsapp_opt_in` on `patients`), separate from and in addition to DPDP consent. Don't send real messages to real patients until both the governance gate above and WhatsApp opt-in are actually in place — right now no WhatsApp provider is even configured, so this is moot, but will matter once one is.
