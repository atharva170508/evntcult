import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const ROLE_REFRESH_MS = 5 * 60_000;

const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    ...(process.env.AUTH_RESEND_KEY
      ? [Resend({ from: process.env.AUTH_EMAIL_FROM ?? "EvntCult <no-reply@example.com>" })]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    signIn({ user }) {
      if (!allowedDomains.length) return true;
      const domain = user.email?.split("@")[1]?.toLowerCase();
      return !!domain && allowedDomains.includes(domain);
    },
    /**
     * Role lives in the JWT for fast middleware checks, but is re-read from
     * the database every few minutes so a verification (or suspension) done
     * by a developer takes effect without the user signing out.
     */
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = (user as { role?: Role }).role ?? "USER";
        token.roleCheckedAt = Date.now();
        return token;
      }
      const stale = Date.now() - ((token.roleCheckedAt as number | undefined) ?? 0) > ROLE_REFRESH_MS;
      if (token.sub && (stale || trigger === "update")) {
        const fresh = await prisma.user.findUnique({ where: { id: token.sub }, select: { role: true } });
        if (!fresh) return null; // user deleted → end session
        token.role = fresh.role;
        token.roleCheckedAt = Date.now();
      }
      return token;
    },
  },
});
