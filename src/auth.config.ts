import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import type { Role } from "@prisma/client";

/**
 * Edge-safe Auth.js config (no Prisma import) — shared by middleware and the
 * full server config in src/auth.ts.
 */

const PROTECTED = ["/dashboard", "/calendar", "/events", "/passes", "/vault", "/venues", "/organizer"];
const ORGANIZER_ONLY = ["/organizer"];

export const authConfig = {
  pages: { signIn: "/signin" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  providers: [Google({ allowDangerousEmailAccountLinking: false })],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      if (process.env.DEMO_MODE === "true") return true;

      const path = nextUrl.pathname;
      const needsAuth = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));
      if (!needsAuth) return true;
      if (!auth?.user) return false; // → redirected to /signin

      const needsOrganizer = ORGANIZER_ONLY.some((p) => path === p || path.startsWith(`${p}/`));
      if (needsOrganizer && auth.user.role !== "ORGANIZER" && auth.user.role !== "ADMIN") {
        return Response.redirect(new URL("/dashboard?denied=organizer", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: Role }).role ?? "USER";
        token.roleCheckedAt = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as Role) ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
