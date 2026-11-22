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
import { layout, P } from "./mail-kit";

type EmailEnv = { BREVO_API_KEY?: string; EMAIL_FROM?: string; EMAIL_PROVIDER?: string };

export type EmailMode = "brevo" | "log" | "off";

export function emailMode(env: EmailEnv = process.env as EmailEnv): EmailMode {
  if (env.BREVO_API_KEY && env.EMAIL_FROM) return "brevo";
  if (env.EMAIL_PROVIDER === "log") return "log";
  return "off";
}

export const codeLoginOn = (env?: EmailEnv) => emailMode(env) !== "off";

export class EmailError extends Error {}

/** The login code on EvntCult paper: the code big and spaced in a ticket-style box. */
export function loginCodeHtml(code: string): string {
  const shown = `${code.slice(0, 3)} ${code.slice(3)}`;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://evntcult.caliper.workers.dev").replace(/\/$/, "");
  return layout({
    title: "Your EvntCult code",
    preheader: `${shown} works for the next 10 minutes.`,
    heading: "Your login code",
    body:
      P("Type this on the sign-in page. It works for the next 10 minutes.") +
      `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px"><tr><td style="border:1px solid #E4DFD0;border-radius:16px;background:#FFFFFF;padding:18px 26px">
<span style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:34px;letter-spacing:8px;color:#1A1A1A">${shown}</span></td></tr></table>` +
      P("If you didn't ask for this, ignore it. Nobody can log in without the code.", "color:#6A6A6A;font-size:13.5px") +
      P("See you at the next one,<br><b style=\"color:#1A1A1A\">Atharva, Nakul and Abhay</b>", "margin:0"),
    footer: "You're getting this because someone asked to log in to EvntCult with this email.",
    siteUrl: base,
  });
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
