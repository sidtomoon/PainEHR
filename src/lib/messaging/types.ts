export interface SendTemplateMessageParams {
  to: string;
  templateName: string;
  languageCode?: string;
  templateParams?: string[];
}

export interface SendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface WhatsAppProvider {
  readonly name: string;
  isConfigured(): boolean;
  sendTemplateMessage(params: SendTemplateMessageParams): Promise<SendResult>;
}
