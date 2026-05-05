// ════════════════════════════════════════════════════════════════
// Email — server-side transactional email helpers
// ════════════════════════════════════════════════════════════════
// Uses Resend (https://resend.com) — set RESEND_API_KEY in .env. We
// fall back to a no-op + console log when the key is missing so local
// dev keeps working without external services.

import { Resend } from "resend";
import { randomBytes, createHash } from "node:crypto";

const FROM = process.env.RESEND_FROM_EMAIL || "Yilow <noreply@yilow.ai>";

let _resend: Resend | null = null;
function client(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (_resend) return _resend;
  _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

interface SendArgs {
  to:      string;
  subject: string;
  html:    string;
  text?:   string;
}

async function send(args: SendArgs): Promise<void> {
  const r = client();
  if (!r) {
    // Dev / unconfigured fallback — log so devs can copy the link.
    console.log("[email:dev]", JSON.stringify({ ...args, html: args.html.slice(0, 200) + "…" }, null, 2));
    return;
  }
  const { error } = await r.emails.send({
    from:    FROM,
    to:      args.to,
    subject: args.subject,
    html:    args.html,
    text:    args.text,
  });
  if (error) throw new Error(error.message ?? "Email send failed");
}

// ── Token generation ──────────────────────────────────────────────────

/** Generate a cryptographically random URL-safe token + its sha256 hash.
 *  We store only the hash in the DB; the plain token goes in the email. */
export function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ── Email templates (Arabic-first RTL HTML) ──────────────────────────

export async function sendVerificationEmail(opts: {
  to:    string;
  name:  string | null;
  link:  string;
}): Promise<void> {
  const subject = "أكّد بريدك الإلكتروني — Yilow.ai";
  const greeting = opts.name ? `مرحباً ${opts.name}،` : "مرحباً،";
  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; background:#0a0a0a; color:#fff; padding:32px 16px; margin:0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px; background:#111116; border:1px solid #ffffff14; border-radius:16px;" cellpadding="0" cellspacing="0">
        <tr><td style="padding:32px 28px 16px 28px;">
          <h1 style="margin:0 0 12px 0; color:#fee440; font-size:24px;">Yilow.ai</h1>
          <h2 style="margin:0 0 8px 0; font-size:20px;">${greeting}</h2>
          <p style="color:#cbd5e1; line-height:1.7; margin:0 0 24px 0;">
            شكراً لتسجيلك في Yilow.ai. اضغط الزرار التالي لتأكيد بريدك الإلكتروني وتفعيل حسابك:
          </p>
          <p style="text-align:center; margin:0 0 24px 0;">
            <a href="${opts.link}" style="display:inline-block; padding:14px 36px; background:#fee440; color:#000; text-decoration:none; font-weight:900; border-radius:12px;">
              تأكيد البريد
            </a>
          </p>
          <p style="color:#94a3b8; font-size:13px; line-height:1.6; margin:0 0 8px 0;">
            أو انسخ الرابط التالي في متصفحك:
          </p>
          <p style="color:#fee440; font-size:12px; word-break:break-all; direction:ltr; text-align:left; background:#000; padding:10px; border-radius:8px;">
            ${opts.link}
          </p>
          <p style="color:#64748b; font-size:12px; margin:24px 0 0 0; line-height:1.6;">
            هذا الرابط صالح لمدة 24 ساعة. لو إنت ما طلبتش الحساب، تجاهل هذه الرسالة.
          </p>
        </td></tr>
      </table>
      <p style="color:#475569; font-size:11px; margin:16px 0 0 0;">© Yilow.ai — جميع الحقوق محفوظة</p>
    </td></tr>
  </table>
</body>
</html>`;
  const text = `${greeting}\n\nأكّد بريدك الإلكتروني عبر هذا الرابط:\n${opts.link}\n\nالرابط صالح لـ 24 ساعة.`;
  await send({ to: opts.to, subject, html, text });
}

export async function sendPasswordResetEmail(opts: {
  to:   string;
  name: string | null;
  link: string;
}): Promise<void> {
  const subject = "إعادة تعيين كلمة المرور — Yilow.ai";
  const greeting = opts.name ? `مرحباً ${opts.name}،` : "مرحباً،";
  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; background:#0a0a0a; color:#fff; padding:32px 16px; margin:0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px; background:#111116; border:1px solid #ffffff14; border-radius:16px;" cellpadding="0" cellspacing="0">
        <tr><td style="padding:32px 28px 16px 28px;">
          <h1 style="margin:0 0 12px 0; color:#fee440; font-size:24px;">Yilow.ai</h1>
          <h2 style="margin:0 0 8px 0; font-size:20px;">${greeting}</h2>
          <p style="color:#cbd5e1; line-height:1.7; margin:0 0 24px 0;">
            تلقّينا طلب إعادة تعيين كلمة مرور حسابك. اضغط الزرار التالي لتعيين كلمة مرور جديدة:
          </p>
          <p style="text-align:center; margin:0 0 24px 0;">
            <a href="${opts.link}" style="display:inline-block; padding:14px 36px; background:#fee440; color:#000; text-decoration:none; font-weight:900; border-radius:12px;">
              إعادة تعيين كلمة المرور
            </a>
          </p>
          <p style="color:#94a3b8; font-size:13px; line-height:1.6; margin:0 0 8px 0;">
            أو انسخ الرابط التالي في متصفحك:
          </p>
          <p style="color:#fee440; font-size:12px; word-break:break-all; direction:ltr; text-align:left; background:#000; padding:10px; border-radius:8px;">
            ${opts.link}
          </p>
          <p style="color:#64748b; font-size:12px; margin:24px 0 0 0; line-height:1.6;">
            هذا الرابط صالح لمدة ساعة واحدة. لو ما طلبتش إعادة التعيين، تجاهل الرسالة — حسابك آمن.
          </p>
        </td></tr>
      </table>
      <p style="color:#475569; font-size:11px; margin:16px 0 0 0;">© Yilow.ai — جميع الحقوق محفوظة</p>
    </td></tr>
  </table>
</body>
</html>`;
  const text = `${greeting}\n\nأعِد تعيين كلمة المرور عبر هذا الرابط:\n${opts.link}\n\nالرابط صالح لمدة ساعة.`;
  await send({ to: opts.to, subject, html, text });
}
