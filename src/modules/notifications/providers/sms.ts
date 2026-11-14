/**
 * SMS provider. Uses Twilio REST API when TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM are set,
 * otherwise falls back to a mock (console log) for local development.
 */

export interface SmsResult {
  ok: boolean;
  providerRef?: string;
  error?: string;
}

export function isSmsConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
}

export async function sendSms(params: { to: string; text: string }): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;

  if (!sid || !token || !from) {
    console.log(`[MOCK SMS] To: ${params.to}, Text: ${params.text.slice(0, 80)}`);
    return { ok: true, providerRef: `mock_sms_${Date.now()}` };
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: params.to, From: from, Body: params.text }).toString(),
    });

    const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, providerRef: data.sid || `tw_${Date.now()}` };
    }
    return { ok: false, error: `Twilio ${res.status}: ${data.message || "failed"}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Twilio request failed" };
  }
}
