import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const run = promisify(execFile);

export type Slot = { x: number; y: number; size: number; w: number; h: number } | null;
export type Analysis = { pageCount: number; slots: Slot[] };

/** Runs the PyMuPDF analysis at upload time. The file is written to a private temp dir, args are fixed strings. */
export async function analyzePdf(bytes: Uint8Array, profile: "HEADER" | "FOOTER"): Promise<Analysis> {
  const dir = await mkdtemp(path.join(tmpdir(), "vl-"));
  try {
    const file = path.join(dir, "in.pdf");
    await writeFile(file, bytes);
    const script = path.resolve("tools", "analyze_slots.py");
    const { stdout } = await run(process.env.PYTHON_BIN ?? "python", [script, file, profile], {
      timeout: 120_000, maxBuffer: 20 * 1024 * 1024,
    });
    return JSON.parse(stdout) as Analysis;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
