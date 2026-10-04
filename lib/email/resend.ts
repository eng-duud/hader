import { Lead } from '@/lib/data/types';
import { EmailProvider } from './index';

export class ResendEmailProvider implements EmailProvider {
  private apiKey: string | undefined;
  private fromAddress: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.fromAddress = process.env.EMAIL_FROM || 'Hader Notifications <notifications@hader.ye>';
  }

  async sendLeadNotification(
    lead: Lead,
    recipientEmail: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const cleanPhone = lead.phone.replace(/[^\d]/g, '');
    const whatsappLink = `https://wa.me/${cleanPhone}`;
    const formattedDate = new Date(lead.created_at || Date.now()).toLocaleString('ar-YE', {
      timeZone: 'Asia/Aden',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const subject = `[حاضر] طلب استفسار جديد: ${lead.name} — ${lead.business_name}`;

    const textContent = `
طلب استفسار جديد عبر موقع حاضر (Hader)
=====================================
الاسم: ${lead.name}
المنشأة: ${lead.business_name}
الهاتف / واتساب: ${lead.phone}
رابط واتساب مباشر: ${whatsappLink}
البريد الإلكتروني: ${lead.email || 'غير محدد'}
الخدمات المطلوبة: ${lead.interests.length > 0 ? lead.interests.join(', ') : 'عام'}
اللغة: ${lead.locale === 'ar' ? 'العربية' : 'English'}
الصفحة المصدر: ${lead.source_page || '/'}
التاريخ: ${formattedDate}

نص الرسالة / تفاصيل الطلب:
-------------------------------------
${lead.message}
=====================================
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f2b3c; padding: 24px 32px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: bold; color: #ffffff; }
    .header p { margin: 4px 0 0 0; font-size: 13px; color: #94a3b8; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #f1f5f9; color: #0f2b3c; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; margin-bottom: 20px; }
    .grid { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .grid td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .grid .label { font-weight: bold; color: #64748b; width: 35%; }
    .grid .val { font-weight: 600; color: #0f172a; }
    .message-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #334155; }
    .btn-container { text-align: center; margin: 32px 0 16px 0; }
    .btn { display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>منظومة حاضر — إشعار طلب جديد</h1>
      <p>تم استلام استفسار جديد عبر استمارة التواصل في الموقع</p>
    </div>
    <div class="body">
      <div class="badge">طلب قيد المتابعة (New Lead)</div>
      
      <table class="grid">
        <tr>
          <td class="label">اسم العميل:</td>
          <td class="val">${escapeHtml(lead.name)}</td>
        </tr>
        <tr>
          <td class="label">اسم المنشأة:</td>
          <td class="val">${escapeHtml(lead.business_name)}</td>
        </tr>
        <tr>
          <td class="label">الهاتف:</td>
          <td class="val" dir="ltr" style="text-align: right; font-family: monospace;">${escapeHtml(lead.phone)}</td>
        </tr>
        <tr>
          <td class="label">البريد الإلكتروني:</td>
          <td class="val">${lead.email ? escapeHtml(lead.email) : '—'}</td>
        </tr>
        <tr>
          <td class="label">الخدمات المختارة:</td>
          <td class="val">${escapeHtml(lead.interests.join(', ') || 'استفسار عام')}</td>
        </tr>
        <tr>
          <td class="label">اللغة / المصدر:</td>
          <td class="val">${lead.locale.toUpperCase()} (${escapeHtml(lead.source_page || '/')})</td>
        </tr>
        <tr>
          <td class="label">وقت الإرسال:</td>
          <td class="val">${formattedDate}</td>
        </tr>
      </table>

      <div style="font-weight: bold; font-size: 13px; color: #64748b; margin-top: 16px;">تفاصيل الطلب والرسالة:</div>
      <div class="message-box">${escapeHtml(lead.message)}</div>

      <div class="btn-container">
        <a href="${whatsappLink}" target="_blank" class="btn">مراسلة العميل فوراً عبر واتساب</a>
      </div>
    </div>
    <div class="footer">
      نظام حاضر لحلول الأعمال الرقمية — إشعار آلي داخلي
    </div>
  </div>
</body>
</html>
`.trim();

    // Check if real Resend API key is provided
    if (!this.apiKey || this.apiKey === 're_placeholder_key') {
      console.log('----------------------------------------------------');
      console.log('[Resend Mock Mode] Lead Notification Captured:');
      console.log(`To: ${recipientEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(textContent);
      console.log('----------------------------------------------------');
      return { success: true, messageId: `mock-resend-${Date.now()}` };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: [recipientEmail],
          subject: subject,
          html: htmlContent,
          text: textContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `Resend API returned status ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error communicating with Resend',
      };
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
