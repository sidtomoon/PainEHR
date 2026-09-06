import type { SendResult, SendTemplateMessageParams, WhatsAppProvider } from '../types';

function normalizePhone(phone: string) {
  const digits = phone.replace(/[^\d]/g, '');
  return `whatsapp:+${digits}`;
}

export class TwilioProvider implements WhatsAppProvider {
  readonly name = 'twilio';

  private get accountSid() {
    return process.env.TWILIO_ACCOUNT_SID;
  }

  private get authToken() {
    return process.env.TWILIO_AUTH_TOKEN;
  }

  private get fromNumber() {
    return process.env.TWILIO_WHATSAPP_FROM; // e.g. "+14155238886"
  }

  isConfigured() {
    return !!(this.accountSid && this.authToken && this.fromNumber);
  }

  // Twilio's business-initiated WhatsApp messages go through its Content API,
  // which is addressed by a Content SID (e.g. "HXxxxxxxxx...") rather than a
  // human-readable template name. `params.templateName` is expected to be
  // that Content SID here.
  async sendTemplateMessage(params: SendTemplateMessageParams): Promise<SendResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Twilio is not configured (missing TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM).' };
    }

    const contentVariables = params.templateParams?.length
      ? JSON.stringify(Object.fromEntries(params.templateParams.map((v, i) => [String(i + 1), v])))
      : undefined;

    const form = new URLSearchParams({
      From: normalizePhone(this.fromNumber!),
      To: normalizePhone(params.to),
      ContentSid: params.templateName,
      ...(contentVariables ? { ContentVariables: contentVariables } : {}),
    });

    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.message || `Twilio API error (HTTP ${res.status})` };
      }
      return { success: true, providerMessageId: data?.sid };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Twilio WhatsApp send failed.' };
    }
  }
}
