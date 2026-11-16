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

export async function sendLoginCode(email: string, code: string, env: EmailEnv = process.env as EmailEnv): Promise<void> {
  const mode = emailMode(env);
  if (mode === "log") {
    console.log(`[email:log] login code for ${email}: ${code}`);
    return;
  }
  if (mode !== "brevo") throw new EmailError("Email sending isn't set up.");

  const text = `Your EvntCult login code is ${code}\n\nIt works for 10 minutes. If you didn't ask for it, you can ignore this email.`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#121218">
<p>Your EvntCult login code is</p>
<p style="font-size:32px;font-weight:800;letter-spacing:6px;margin:8px 0">${code}</p>
<p style="color:#6b6b79">It works for 10 minutes. If you didn't ask for it, you can ignore this email.</p></div>`;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "EvntCult", email: env.EMAIL_FROM },
      to: [{ email }],
      subject: `${code} is your EvntCult login code`,
      textContent: text,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    console.error(`[email] Brevo send failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    throw new EmailError("We couldn't send the email. Try again in a minute.");
  }
}
