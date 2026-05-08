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
//
// All templates share the same shell — dark Yilow theme, brand-yellow
// CTA button, fallback plain-text version. Compose your body inside
// `renderShell({greeting, body, cta?, fineprint?})`.

interface ShellArgs {
  subject:   string;
  greeting:  string;
  /** Inner HTML — paragraphs, lists, etc. Already RTL-styled. */
  body:      string;
  /** Optional primary call-to-action. */
  cta?: { label: string; href: string };
  /** Optional smaller note rendered at the bottom. */
  fineprint?: string;
}

function renderShell({ subject, greeting, body, cta, fineprint }: ShellArgs): string {
  const ctaBlock = cta
    ? `
          <p style="text-align:center; margin:0 0 24px 0;">
            <a href="${cta.href}" style="display:inline-block; padding:14px 36px; background:#fee440; color:#000; text-decoration:none; font-weight:900; border-radius:12px;">
              ${cta.label}
            </a>
          </p>
          <p style="color:#94a3b8; font-size:13px; line-height:1.6; margin:0 0 8px 0;">
            أو انسخ الرابط التالي في متصفحك:
          </p>
          <p style="color:#fee440; font-size:12px; word-break:break-all; direction:ltr; text-align:left; background:#000; padding:10px; border-radius:8px;">
            ${cta.href}
          </p>`
    : "";
  const fineprintBlock = fineprint
    ? `<p style="color:#64748b; font-size:12px; margin:24px 0 0 0; line-height:1.6;">${fineprint}</p>`
    : "";
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; background:#0a0a0a; color:#fff; padding:32px 16px; margin:0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px; background:#111116; border:1px solid #ffffff14; border-radius:16px;" cellpadding="0" cellspacing="0">
        <tr><td style="padding:32px 28px 16px 28px;">
          <h1 style="margin:0 0 12px 0; color:#fee440; font-size:24px;">Yilow.ai</h1>
          <h2 style="margin:0 0 8px 0; font-size:20px;">${greeting}</h2>
          ${body}${ctaBlock}${fineprintBlock}
        </td></tr>
      </table>
      <p style="color:#475569; font-size:11px; margin:16px 0 0 0;">© Yilow.ai — جميع الحقوق محفوظة</p>
    </td></tr>
  </table>
</body>
</html>`;
}

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

// ── Welcome email — fired after the user confirms their address ───────

export async function sendWelcomeEmail(opts: {
  to:           string;
  name:         string | null;
  appUrl:       string;
  signupCredits: number;
}): Promise<void> {
  const subject  = "أهلاً بك في Yilow.ai 🎉";
  const greeting = opts.name ? `أهلاً ${opts.name}،` : "أهلاً،";
  const html = renderShell({
    subject, greeting,
    body: `
          <p style="color:#cbd5e1; line-height:1.7; margin:0 0 16px 0;">
            تم تأكيد بريدك بنجاح. مرحباً بك في <strong>Yilow.ai</strong> — منصة الذكاء الاصطناعي العربية.
          </p>
          <p style="color:#cbd5e1; line-height:1.7; margin:0 0 16px 0;">
            بدأنا حسابك بـ <span style="color:#fee440; font-weight:900;">${opts.signupCredits} كريديت</span> هدية ترحيب — جرّب الأدوات وشوف اللي بتطلعه.
          </p>
          <p style="color:#cbd5e1; line-height:1.7; margin:0 0 24px 0;">
            ابدأ من هنا:
          </p>
          <ul style="color:#cbd5e1; line-height:1.9; margin:0 0 24px 0; padding-right:20px;">
            <li>🎨 <strong>Soul</strong> — صور Editorial فاشن</li>
            <li>🎬 <strong>Cinema Studio</strong> — صور وفيديوهات سينمائية</li>
            <li>📢 <strong>Marketing Studio</strong> — إعلانات منتجات/تطبيقات</li>
            <li>✨ ٣٦ أداة AI تانية للصور، الفيديو، والصوت</li>
          </ul>`,
    cta: { label: "ابدأ التوليد", href: `${opts.appUrl}/dashboard` },
    fineprint: "احتجت مساعدة؟ ردّ على هذه الرسالة وفريقنا هيرد عليك.",
  });
  const text = `${greeting}\n\nمرحباً بك في Yilow.ai!\nبدأنا حسابك بـ ${opts.signupCredits} كريديت هدية. ابدأ من ${opts.appUrl}/dashboard`;
  await send({ to: opts.to, subject, html, text });
}

// ── Password changed confirmation — fired after a successful reset ─────

export async function sendPasswordChangedEmail(opts: {
  to:        string;
  name:      string | null;
  appUrl:    string;
  /** When the change occurred — server time, used for forensics. */
  when:      Date;
  /** Best-effort — derived from request header. */
  ip?:       string | null;
}): Promise<void> {
  const subject  = "تم تغيير كلمة المرور — Yilow.ai";
  const greeting = opts.name ? `مرحباً ${opts.name}،` : "مرحباً،";
  // dd/mm/yyyy hh:mm Cairo time would need TZ work; ISO is unambiguous + safe
  const when = opts.when.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const ipLine = opts.ip ? `<br/>عنوان IP: <span style="color:#fee440;">${opts.ip}</span>` : "";
  const html = renderShell({
    subject, greeting,
    body: `
          <p style="color:#cbd5e1; line-height:1.7; margin:0 0 16px 0;">
            تم تغيير كلمة مرور حسابك بنجاح.
          </p>
          <div style="background:#000; border:1px solid #ffffff14; border-radius:8px; padding:14px; margin:0 0 24px 0;">
            <p style="color:#94a3b8; font-size:13px; margin:0; line-height:1.7;">
              التوقيت: <span style="color:#fee440;">${when}</span>${ipLine}
            </p>
          </div>
          <p style="color:#cbd5e1; line-height:1.7; margin:0 0 16px 0;">
            <strong>إنت اللي عملت ده؟</strong> ممتاز — ما تحتاجش أي حاجة.
          </p>
          <p style="color:#fca5a5; line-height:1.7; margin:0 0 24px 0;">
            <strong>مش إنت؟</strong> روح فوراً <a href="${opts.appUrl}/forgot-password" style="color:#fee440;">صفحة استعادة كلمة المرور</a> وابعت لنا على فوراً.
          </p>`,
    cta: { label: "افتح حسابك", href: `${opts.appUrl}/settings` },
    fineprint: "هذه الرسالة تأكيدية تلقائية. لو شفت أي نشاط مش بتاعك، تواصل معنا فوراً.",
  });
  const text = `${greeting}\n\nتم تغيير كلمة المرور — ${when}${opts.ip ? ` من ${opts.ip}` : ""}\nلو مش إنت، روح ${opts.appUrl}/forgot-password فوراً.`;
  await send({ to: opts.to, subject, html, text });
}

// ── Generation ready — fires when a long video / heavy task finishes ──

export async function sendGenerationReadyEmail(opts: {
  to:           string;
  name:         string | null;
  appUrl:       string;
  toolName:     string;
  /** Direct link to the generated asset (image/video/audio). */
  resultUrl:    string;
  /** Internal generation id — links to the dashboard preview page. */
  generationId: string;
  /** Optional preview thumbnail (defaults to a generic icon). */
  previewUrl?:  string;
  durationMs?:  number;
}): Promise<void> {
  const subject  = `${opts.toolName} — جاهز ✓ | Yilow.ai`;
  const greeting = opts.name ? `${opts.name}،` : "مرحباً،";
  const dur = opts.durationMs ? `${Math.round(opts.durationMs / 1000)} ثانية` : "أقل مما توقعت";
  const previewBlock = opts.previewUrl
    ? `<p style="margin:0 0 24px 0; text-align:center;">
         <img src="${opts.previewUrl}" alt="" style="max-width:100%; height:auto; border-radius:12px; border:1px solid #ffffff14;"/>
       </p>`
    : "";
  const html = renderShell({
    subject, greeting,
    body: `
          <p style="color:#cbd5e1; line-height:1.7; margin:0 0 16px 0;">
            خلصنا توليد <strong>${opts.toolName}</strong> بتاعك — العملية أخدت <span style="color:#fee440;">${dur}</span>.
          </p>
          ${previewBlock}`,
    cta: { label: "افتح النتيجة", href: `${opts.appUrl}/dashboard?gen=${opts.generationId}` },
    fineprint: `الرابط المباشر: ${opts.resultUrl}`,
  });
  const text = `${greeting}\n\n${opts.toolName} جاهز.\nشوف النتيجة: ${opts.resultUrl}`;
  await send({ to: opts.to, subject, html, text });
}

// ── Credits low warning — fires when balance crosses a threshold ──────

export async function sendCreditsLowEmail(opts: {
  to:       string;
  name:     string | null;
  appUrl:   string;
  balance:  number;
  /** Renewal date for paid plans (null on free). */
  renewsAt: Date | null;
}): Promise<void> {
  const subject  = `رصيدك على وشك الانتهاء — ${opts.balance} كريديت`;
  const greeting = opts.name ? `مرحباً ${opts.name}،` : "مرحباً،";
  const renewLine = opts.renewsAt
    ? `<p style="color:#94a3b8; font-size:13px; line-height:1.7; margin:0 0 16px 0;">
         سيتم تجديد رصيدك تلقائياً في <span style="color:#fee440;">${opts.renewsAt.toISOString().slice(0, 10)}</span>.
       </p>`
    : `<p style="color:#94a3b8; font-size:13px; line-height:1.7; margin:0 0 16px 0;">
         فعّل خطة شهرية أو اشترِ باقة كريديت لتفادي توقّف الأدوات.
       </p>`;
  const html = renderShell({
    subject, greeting,
    body: `
          <p style="color:#cbd5e1; line-height:1.7; margin:0 0 16px 0;">
            رصيدك الحالي: <span style="color:#fee440; font-size:32px; font-weight:900;">${opts.balance}</span> كريديت.
          </p>
          ${renewLine}`,
    cta: { label: "اشحن الرصيد", href: `${opts.appUrl}/pricing` },
  });
  const text = `${greeting}\nرصيدك ${opts.balance} كريديت.\nاشحن: ${opts.appUrl}/pricing`;
  await send({ to: opts.to, subject, html, text });
}

// ── New device login alert — fires on sign-in from a new IP/UA combo ──

export async function sendNewDeviceLoginEmail(opts: {
  to:        string;
  name:      string | null;
  appUrl:    string;
  when:      Date;
  ip?:       string | null;
  userAgent?: string | null;
}): Promise<void> {
  const subject  = "تسجيل دخول من جهاز جديد — Yilow.ai";
  const greeting = opts.name ? `مرحباً ${opts.name}،` : "مرحباً،";
  const when = opts.when.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const lines = [
    `<strong>التوقيت:</strong> <span style="color:#fee440;">${when}</span>`,
    opts.ip ? `<strong>عنوان IP:</strong> <span style="color:#fee440;">${opts.ip}</span>` : "",
    opts.userAgent ? `<strong>الجهاز:</strong> <span style="color:#cbd5e1;">${opts.userAgent}</span>` : "",
  ].filter(Boolean).join("<br/>");
  const html = renderShell({
    subject, greeting,
    body: `
          <p style="color:#cbd5e1; line-height:1.7; margin:0 0 16px 0;">
            تم تسجيل الدخول لحسابك من جهاز جديد.
          </p>
          <div style="background:#000; border:1px solid #ffffff14; border-radius:8px; padding:14px; margin:0 0 24px 0; line-height:1.9; color:#cbd5e1; font-size:13px;">
            ${lines}
          </div>
          <p style="color:#cbd5e1; line-height:1.7; margin:0 0 16px 0;">
            <strong>إنت اللي سجّلت الدخول؟</strong> ممتاز — تجاهل الرسالة.
          </p>
          <p style="color:#fca5a5; line-height:1.7; margin:0 0 24px 0;">
            <strong>مش إنت؟</strong> غيّر كلمة المرور دلوقتي وراجع نشاط حسابك.
          </p>`,
    cta: { label: "غيّر كلمة المرور", href: `${opts.appUrl}/forgot-password` },
    fineprint: "هذه الرسالة تنبيهية أمنية. ما تردّش — استخدم الزرار أعلاه.",
  });
  const text = `${greeting}\n\nتسجيل دخول جديد على حسابك في ${when}${opts.ip ? ` من ${opts.ip}` : ""}.\nلو مش إنت: ${opts.appUrl}/forgot-password`;
  await send({ to: opts.to, subject, html, text });
}

