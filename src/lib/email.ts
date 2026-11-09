/**
 * Sends the login-code email.
 *
 * Provider: Brevo (https://www.brevo.com), called with plain fetch, so no extra package.
 * Secrets (set with `npx wrangler secret put`, never committed):
 *   BREVO_API_KEY   the Brevo API key
 *   EMAIL_FROM      the verified sender address, e.g. evntcult.app@gmail.com
 * For local testing only, put EMAIL_PROVIDER=log in .dev.vars: codes are printed to the
 * server log instead of being emailed.
 *
 * If neither is set, code login is OFF and the old email-only login keeps working
 * (the sign-in page shows that the code check is "Planned").
 */
type EmailEnv = { BREVO_API_KEY?: string; EMAIL_FROM?: string; EMAIL_PROVIDER?: string };

export type EmailMode = "brevo" | "log" | "off";

export function emailMode(env: EmailEnv = process.env as EmailEnv): EmailMode {
  if (env.BREVO_API_KEY && env.EMAIL_FROM) return "brevo";
  if (env.EMAIL_PROVIDER === "log") return "log";
  return "off";
}

export const codeLoginOn = (env?: EmailEnv) => emailMode(env) !== "off";

export class EmailError extends Error {}

/** A note from a person on brand paper: dark masthead, and the code marked up with a highlighter. */
export function loginCodeHtml(code: string): string {
  const shown = `${code.slice(0, 3)} ${code.slice(3)}`;
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
  const line = `font-family:${font};font-size:15px;line-height:1.55;color:#2a2a2e;margin:0 0 16px`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>Your EvntCult code</title></head>
<body style="margin:0;padding:0;background:#efeee8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#efeee8" style="background:#efeee8"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;border-radius:14px;overflow:hidden">
<tr><td bgcolor="#08080c" style="background:#08080c;padding:20px 28px;font-family:${font};font-size:22px;font-weight:800;letter-spacing:-0.8px;color:#f2f3f7">ev<span style="color:#dcfe62">|</span>ntcult</td></tr>
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:28px">
<p style="${line}">Hey,</p>
<p style="${line}">Here's your code to log in:</p>
<p style="margin:0 0 20px"><span style="display:inline-block;background:#dcfe62;border-radius:6px;padding:8px 14px;font-family:${font};font-size:30px;line-height:1.2;font-weight:700;letter-spacing:1px;color:#08080c">${shown}</span></p>
<p style="${line}">It works for the next 10 minutes. If this wasn't you, just ignore this email and nothing changes.</p>
<p style="${line};margin-bottom:0">See you at the next one,<br><b style="color:#08080c">Atharva, Nakul and Abhay</b></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export async function sendLoginCode(email: string, code: string, env: EmailEnv = process.env as EmailEnv): Promise<void> {
  const mode = emailMode(env);
  if (mode === "log") {
    console.log(`[email:log] login code for ${email}: ${code}`);
    return;
  }
  if (mode !== "brevo") throw new EmailError("Email sending isn't set up.");

  const text = `Hey,\n\nHere's your code to log in to EvntCult:\n\n${code.slice(0, 3)} ${code.slice(3)}\n\nIt works for the next 10 minutes. If this wasn't you, just ignore this email and nothing changes.\n\nSee you at the next one,\nAtharva, Nakul and Abhay`;
  const html = loginCodeHtml(code);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "EvntCult", email: env.EMAIL_FROM },
      to: [{ email }],
      subject: `Your EvntCult code: ${code}`,
      textContent: text,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    console.error(`[email] Brevo send failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    throw new EmailError("We couldn't send the email. Try again in a minute.");
  }
}
