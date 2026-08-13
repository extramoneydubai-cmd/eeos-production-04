/**
 * Shared performer resolver for engine handlers.
 *
 * Real sessions resolve the performer via withScopeAndEvents
 * (ctx.__performerUserId, set from the session token). Demo/local sessions
 * (no resolvable session token) fall back to the first super-admin user (the
 * seeded CEO) so workflows keep working end-to-end instead of throwing
 * "Not authenticated" — consistent across attendance, payroll, HR and
 * recruitment engines.
 *
 * Returns undefined only when there is no performer at all (e.g. an empty
 * users table), in which case handlers can omit optional attribution fields.
 */
export async function resolvePerformer(ctx: any): Promise<string | undefined> {
  if (ctx.__performerUserId) return ctx.__performerUserId as string;
  try {
    const users = await ctx.db.query("users").collect();
    const admin = users.find(
      (u: any) => u.role === "super_admin" || u.username === "ceo"
    );
    return admin?._id as string | undefined;
  } catch {
    return undefined;
  }
}
