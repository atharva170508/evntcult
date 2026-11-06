/**
 * Developer-only: verify (or reject/suspend) an organizer application.
 *
 *   npm run organizer:verify -- someone@college.edu
 *   npm run organizer:verify -- someone@college.edu --reject "No proof of role"
 *   npm run organizer:verify -- someone@college.edu --suspend
 *
 * Verification is deliberately a CLI/DB action, not a UI button, so no web
 * request can ever escalate a user to ORGANIZER.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email, flag, note] = process.argv.slice(2);
  if (!email) throw new Error("Usage: npm run organizer:verify -- <email> [--reject <note> | --suspend]");

  const user = await prisma.user.findUnique({ where: { email }, include: { organizerProfile: true } });
  if (!user) throw new Error(`No user with email ${email}`);
  if (!user.organizerProfile) throw new Error(`${email} has not applied to be an organizer.`);

  const status = flag === "--reject" ? "REJECTED" : flag === "--suspend" ? "SUSPENDED" : "VERIFIED";

  await prisma.$transaction([
    prisma.organizerProfile.update({
      where: { userId: user.id },
      data: { status, reviewNotes: note ?? null, verifiedAt: status === "VERIFIED" ? new Date() : null },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { role: status === "VERIFIED" ? "ORGANIZER" : user.role === "ADMIN" ? "ADMIN" : "USER" },
    }),
    prisma.auditLog.create({
      data: { action: `organizer.${status.toLowerCase()}`, target: `user:${user.id}`, meta: { email, note, via: "cli" } },
    }),
  ]);

  console.log(`${email} → ${status}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
