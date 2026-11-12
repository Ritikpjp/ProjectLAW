import { PDFDocument } from "pdf-lib";
import { analyzePdf, type Slot } from "@/lib/pdf/analyze";
import { makePreview } from "@/lib/pdf/stamp";
import { deleteFile, putFile } from "@/lib/storage";

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const PREVIEW_PAGES = 3;

export type IngestedFile = {
  storageKey: string; previewKey: string; label: string;
  pageCount: number; slotsJson: string; bytes: number; sortOrder: number;
};

// Validates each upload, cuts the free preview, finds QR slots and stores the files privately.
// On any failure everything already stored is removed and an Error with a user-facing message is thrown.
export async function ingestPdfs(uploads: File[], profile: "HEADER" | "FOOTER", startOrder = 0) {
  const warnings: string[] = [];
  const created: IngestedFile[] = [];
  try {
    for (const [i, f] of uploads.entries()) {
      if (f.size > MAX_FILE_BYTES) throw new Error(`${f.name} is larger than 100 MB`);
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") throw new Error(`${f.name} is not a PDF`);
      try { await PDFDocument.load(bytes); } catch { throw new Error(`${f.name} is damaged or password protected`); }

      let slots: Slot[];
      let pageCount: number;
      try {
        const a = await analyzePdf(bytes, profile);
        slots = a.slots; pageCount = a.pageCount;
      } catch (e) {
        console.error("analyze failed", e);
        warnings.push(`${f.name}: QR placement analysis failed (is Python + PyMuPDF installed?). Using the corner fallback.`);
        pageCount = (await PDFDocument.load(bytes)).getPageCount();
        slots = Array(pageCount).fill(null);
      }
      const preview = await makePreview(bytes, PREVIEW_PAGES);
      const storageKey = await putFile("orig", bytes);
      const previewKey = await putFile("preview", preview.bytes);
      created.push({
        storageKey, previewKey, pageCount, bytes: bytes.length, sortOrder: startOrder + i,
        label: f.name.replace(/\.pdf$/i, "").slice(0, 120), slotsJson: JSON.stringify(slots),
      });
    }
  } catch (e) {
    await Promise.all(created.flatMap((c) => [deleteFile("orig", c.storageKey), deleteFile("preview", c.previewKey)]));
    throw e;
  }
  return { created, warnings };
}
