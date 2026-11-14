/**
 * Email provider. Uses SendGrid HTTP API when SENDGRID_API_KEY is set,
 * otherwise falls back to a mock (console log) for local development.
 */

export interface EmailResult {
  ok: boolean;
  providerRef?: string;
  error?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY);
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM || "noreply@parda.ru";

  if (!apiKey) {
    console.log(`[MOCK EMAIL] To: ${params.to}, Subject: ${params.subject}`);
    return { ok: true, providerRef: `mock_email_${Date.now()}` };
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: from, name: "ПарДа" },
        subject: params.subject,
        content: [
          { type: "text/plain", value: params.text },
          ...(params.html ? [{ type: "text/html", value: params.html }] : []),
        ],
      }),
    });

    if (res.status >= 200 && res.status < 300) {
      const providerRef = res.headers.get("x-message-id") || `sg_${Date.now()}`;
      return { ok: true, providerRef };
    }
    const errText = await res.text().catch(() => "");
    return { ok: false, error: `SendGrid ${res.status}: ${errText.slice(0, 300)}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || "SendGrid request failed" };
  }
}
