import "server-only";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/api";
import { ADMIN_COOKIE, readAdminValue } from "@/lib/session";

export async function requireOwner() {
  if (!(await readAdminValue((await cookies()).get(ADMIN_COOKIE)?.value))) throw new ApiError(401, "unauthenticated", "Open the owner panel first.");
}
