import { MetaCloudApiProvider } from './providers/meta';
import { TwilioProvider } from './providers/twilio';
import type { SendResult, WhatsAppProvider } from './types';

const PROVIDERS: Record<string, () => WhatsAppProvider> = {
  meta: () => new MetaCloudApiProvider(),
  twilio: () => new TwilioProvider(),
};

function getProvider(): WhatsAppProvider | null {
  const name = process.env.WHATSAPP_PROVIDER;
  if (!name || !PROVIDERS[name]) return null;
  return PROVIDERS[name]();
}

export function isMessagingConfigured() {
  const provider = getProvider();
  return !!provider?.isConfigured();
}

// Reminder template is expected to have 3 body variables: patient name,
// appointment type ("follow-up" / "procedure"), and the scheduled date.
export async function sendAppointmentReminder(params: {
  phone: string;
  patientName: string;
  appointmentType: string;
  scheduledDate: string;
}): Promise<SendResult> {
  const provider = getProvider();
  if (!provider) return { success: false, error: 'No WHATSAPP_PROVIDER configured.' };

  const templateName = process.env.WHATSAPP_REMINDER_TEMPLATE;
  if (!templateName) return { success: false, error: 'WHATSAPP_REMINDER_TEMPLATE is not set.' };

  return provider.sendTemplateMessage({
    to: params.phone,
    templateName,
    templateParams: [params.patientName, params.appointmentType, params.scheduledDate],
  });
}

// Announcement template is expected to have a single body variable holding
// the full message text (e.g. body: "{{1}}").
export async function sendAnnouncement(params: { phone: string; message: string }): Promise<SendResult> {
  const provider = getProvider();
  if (!provider) return { success: false, error: 'No WHATSAPP_PROVIDER configured.' };

  const templateName = process.env.WHATSAPP_ANNOUNCEMENT_TEMPLATE;
  if (!templateName) return { success: false, error: 'WHATSAPP_ANNOUNCEMENT_TEMPLATE is not set.' };

  return provider.sendTemplateMessage({
    to: params.phone,
    templateName,
    templateParams: [params.message],
  });
}

// Pre-op template is expected to have 6 body variables: patient name,
// procedure name, date, time, location, and free-text special instructions
// (fasting/medication-hold/what-to-bring — phrase these positively, e.g.
// "bring your last MRI film" rather than a list of what not to bring).
export async function sendPreOpInstructions(params: {
  phone: string;
  patientName: string;
  procedureName: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  instructions: string;
}): Promise<SendResult> {
  const provider = getProvider();
  if (!provider) return { success: false, error: 'No WHATSAPP_PROVIDER configured.' };

  const templateName = process.env.WHATSAPP_PREOP_TEMPLATE;
  if (!templateName) return { success: false, error: 'WHATSAPP_PREOP_TEMPLATE is not set.' };

  return provider.sendTemplateMessage({
    to: params.phone,
    templateName,
    templateParams: [
      params.patientName, params.procedureName, params.scheduledDate,
      params.scheduledTime, params.location, params.instructions,
    ],
  });
}

// Post-op template is expected to have 3 body variables: patient name,
// procedure name, and free-text wound-care/activity/red-flag instructions.
export async function sendPostOpInstructions(params: {
  phone: string;
  patientName: string;
  procedureName: string;
  instructions: string;
}): Promise<SendResult> {
  const provider = getProvider();
  if (!provider) return { success: false, error: 'No WHATSAPP_PROVIDER configured.' };

  const templateName = process.env.WHATSAPP_POSTOP_TEMPLATE;
  if (!templateName) return { success: false, error: 'WHATSAPP_POSTOP_TEMPLATE is not set.' };

  return provider.sendTemplateMessage({
    to: params.phone,
    templateName,
    templateParams: [params.patientName, params.procedureName, params.instructions],
  });
}

// Check-in template is expected to have 2 body variables: patient name and
// a link to the token-gated public check-in page (see /checkin/[token]).
export async function sendCheckinPrompt(params: {
  phone: string;
  patientName: string;
  checkinUrl: string;
}): Promise<SendResult> {
  const provider = getProvider();
  if (!provider) return { success: false, error: 'No WHATSAPP_PROVIDER configured.' };

  const templateName = process.env.WHATSAPP_CHECKIN_TEMPLATE;
  if (!templateName) return { success: false, error: 'WHATSAPP_CHECKIN_TEMPLATE is not set.' };

  return provider.sendTemplateMessage({
    to: params.phone,
    templateName,
    templateParams: [params.patientName, params.checkinUrl],
  });
}
