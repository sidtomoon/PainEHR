import type { SendResult, SendTemplateMessageParams, WhatsAppProvider } from '../types';

function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, '');
}

export class MetaCloudApiProvider implements WhatsAppProvider {
  readonly name = 'meta';

  private get token() {
    return process.env.META_WHATSAPP_TOKEN;
  }

  private get phoneNumberId() {
    return process.env.META_PHONE_NUMBER_ID;
  }

  private get apiVersion() {
    return process.env.META_WHATSAPP_API_VERSION || 'v21.0';
  }

  isConfigured() {
    return !!(this.token && this.phoneNumberId);
  }

  async sendTemplateMessage(params: SendTemplateMessageParams): Promise<SendResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Meta WhatsApp Cloud API is not configured (missing META_WHATSAPP_TOKEN / META_PHONE_NUMBER_ID).' };
    }

    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: normalizePhone(params.to),
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.languageCode || 'en_US' },
        ...(params.templateParams?.length
          ? { components: [{ type: 'body', parameters: params.templateParams.map((text) => ({ type: 'text', text })) }] }
          : {}),
      },
    };

    try {
      const res = await fetch(`https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.error?.message || `Meta API error (HTTP ${res.status})` };
      }
      return { success: true, providerMessageId: data?.messages?.[0]?.id };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Meta WhatsApp send failed.' };
    }
  }
}
