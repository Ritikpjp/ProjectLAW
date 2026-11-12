import { db } from "./db";

/** Fixed-window limiter backed by the DB (fine for one region; swap for Redis at scale). */
export async function rateLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  const now = new Date();
  const row = await db.rateLimit.findUnique({ where: { key } });
  if (!row || row.resetAt <= now) {
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt: new Date(now.getTime() + windowSec * 1000) },
      update: { count: 1, resetAt: new Date(now.getTime() + windowSec * 1000) },
    });
    return true;
  }
  if (row.count >= max) return false;
  await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}
