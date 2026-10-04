import { Lead } from '@/lib/data/types';
import { ResendEmailProvider } from './resend';

export interface EmailProvider {
  sendLeadNotification(
    lead: Lead,
    recipientEmail: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// Default provider instance (can be swapped with SMTP, Postmark, AWS SES, etc.)
let activeEmailProvider: EmailProvider = new ResendEmailProvider();

export function setEmailProvider(provider: EmailProvider) {
  activeEmailProvider = provider;
}

export function getEmailProvider(): EmailProvider {
  return activeEmailProvider;
}

/**
 * High-level helper to send lead notification safely.
 * Will never throw: logs errors internally to preserve the saved lead.
 */
export async function dispatchLeadNotification(
  lead: Lead,
  ownerEmail?: string | null
): Promise<{ success: boolean; error?: string }> {
  const targetEmail = ownerEmail || process.env.OWNER_NOTIFICATION_EMAIL || 'contact@hader.ye';

  try {
    const provider = getEmailProvider();
    const result = await provider.sendLeadNotification(lead, targetEmail);
    if (!result.success) {
      console.warn('[Email Notification Warning] Failed to send email via provider:', result.error);
    }
    return result;
  } catch (err: any) {
    console.error('[Email Notification Error] Unhandled exception during email dispatch:', err.message || err);
    return { success: false, error: err.message || 'Internal email dispatch error' };
  }
}
