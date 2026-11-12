import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import path from "node:path";

/**
 * Private file store. Files live outside /public and are only reachable through
 * authorised route handlers. Keys are server-generated UUIDs, never user input.
 * Swap this module for S3/Supabase Storage in production without touching callers.
 */
const ROOT = path.resolve(process.env.STORAGE_DIR ?? "storage");
const KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/;

function resolveKey(kind: "orig" | "preview" | "cache", key: string) {
  if (!KEY.test(key)) throw new Error("Bad storage key");
  return path.join(ROOT, kind, key);
}

export async function putFile(kind: "orig" | "preview", data: Uint8Array): Promise<string> {
  const key = `${randomUUID()}.pdf`;
  const p = resolveKey(kind, key);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, data, { flag: "wx" });
  return key;
}

export const getFile = (kind: "orig" | "preview", key: string) => readFile(resolveKey(kind, key));
export const deleteFile = (kind: "orig" | "preview", key: string) => rm(resolveKey(kind, key), { force: true });

/** Deterministic UUID-shaped key derived from arbitrary text (order + file). */
function cacheKey(name: string) {
  const h = createHash("sha256").update(name).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}.pdf`;
}

export async function getCached(name: string): Promise<Buffer | null> {
  try { return await readFile(resolveKey("cache", cacheKey(name))); } catch { return null; }
}
export async function putCached(name: string, data: Uint8Array) {
  const p = resolveKey("cache", cacheKey(name));
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, data);
}
