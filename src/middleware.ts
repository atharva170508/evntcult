import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Demo mode needs no session (and no AUTH_SECRET), so skip Auth.js entirely.
export default process.env.DEMO_MODE === "true"
  ? () => NextResponse.next()
  : auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp)$).*)"],
};
