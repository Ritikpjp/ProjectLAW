import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { Slot } from "./analyze";

export type Buyer = { name: string; mobile: string; email: string; licenceId: string };
export type Profile = "HEADER" | "FOOTER";

const GREY = rgb(0.35, 0.37, 0.42);

/** Standard fonts only cover WinAnsi; replace anything else so a name never crashes a download. */
function clean(font: PDFFont, s: string): string {
  let out = "";
  for (const ch of s.normalize("NFC")) {
    try { font.encodeText(ch); out += ch; } catch { out += "?"; }
  }
  return out;
}

function line(b: Buyer, profile: Profile): string {
  const who = `Licensed to: ${b.name} | Mobile: ${b.mobile} | ${b.email}`;
  return profile === "FOOTER"
    ? `${who} | Licence ID: ${b.licenceId} | Personal use only. Sharing or copying is prohibited.`
    : who;
}

function drawQr(page: ReturnType<PDFDocument["getPages"]>[number], slot: NonNullable<Slot>, payload: string) {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const border = 1;
  const cell = slot.size / (n + 2 * border);
  const left = slot.x;
  const top = page.getHeight() - slot.y; // convert from top-left to pdf bottom-left origin
  page.drawRectangle({ x: left, y: top - slot.size, width: slot.size, height: slot.size, color: rgb(1, 1, 1) });
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.modules.get(r, c)) continue;
      page.drawRectangle({
        x: left + (c + border) * cell,
        y: top - (r + border + 1) * cell,
        width: cell + 0.02, height: cell + 0.02, color: rgb(0, 0, 0),
      });
    }
  }
}

/** Fallback when no free spot was found: bottom-right corner margin. */
function fallbackSlot(page: ReturnType<PDFDocument["getPages"]>[number]): NonNullable<Slot> {
  return { x: page.getWidth() - 36, y: page.getHeight() - 70, size: 28, w: page.getWidth(), h: page.getHeight() };
}

export async function stampPdf(
  original: Uint8Array, buyer: Buyer, profile: Profile, slots: Slot[], verifyBase: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(original, { ignoreEncryption: false, updateMetadata: false });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const size = profile === "FOOTER" ? 6 : 6.5;
  const text = clean(font, line(buyer, profile));
  doc.getPages().forEach((page, i) => {
    if (i === 0) return; // cover stays clean
    const w = page.getWidth();
    const tw = font.widthOfTextAtSize(text, size);
    const baselineFromTop = profile === "FOOTER" ? 767 : 11;
    page.drawText(text, { x: Math.max(4, (w - tw) / 2), y: page.getHeight() - baselineFromTop, size, font, color: GREY });
    drawQr(page, slots[i] ?? fallbackSlot(page), `${verifyBase}${buyer.licenceId}.${i + 1}`);
  });
  doc.setSubject(`Licence ${buyer.licenceId}`);
  doc.setProducer("Vipulaw");
  doc.setCreator("Vipulaw");
  return doc.save();
}

export async function makePreview(original: Uint8Array, pages: number): Promise<{ bytes: Uint8Array; pageCount: number }> {
  const src = await PDFDocument.load(original);
  const total = src.getPageCount();
  const out = await PDFDocument.create();
  const n = Math.min(pages, total);
  const copied = await out.copyPages(src, Array.from({ length: n }, (_, i) => i));
  copied.forEach((p) => out.addPage(p));
  out.setProducer("Vipulaw");
  return { bytes: await out.save(), pageCount: total };
}
