"""Stamp buyer details + a small vector QR onto a notes PDF.

Two layouts ("profiles"), one per product style:
  header : buyer line in the top margin            (Jurisprudence MCQs)
  footer : buyer line just above the gold footer rule (Practice books)

The QR goes into the emptiest spot on each page, found by scanning for a
rectangle that touches no text, image or box. Page margins are preferred.
"""
import sys
import pymupdf as fitz
import segno

FONT = r"C:\Windows\Fonts\arial.ttf"
GREY = (0.35, 0.37, 0.42)
QR_SIZE = 30        # pt, including the quiet zone (about 10.5 mm)
PAD = 3             # keep-clear distance around the QR
STEP = 2


def line_text(b):
    return f"Licensed to: {b['name']} | Mobile: {b['mobile']} | {b['email']}"


def foot_text(b):
    return (f"Licensed to: {b['name']} | Mobile: {b['mobile']} | {b['email']} | "
            f"Licence ID: {b['licence']} | Personal use only. Sharing or copying is prohibited.")


def strip_old_stamp(page):
    """Remove an earlier prototype stamp (header line, old QRs, footer note)."""
    qr_xrefs = set()
    for im in page.get_image_info(xrefs=True):
        x0, y0, x1, y1 = im["bbox"]
        w, h = x1 - x0, y1 - y0
        if 35 < w < 60 and abs(w - h) < 2 and 80 < y0 and y1 < 770 and im["xref"]:
            qr_xrefs.add(im["xref"])
    for xref in qr_xrefs:
        page.delete_image(xref)
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0:
            continue
        for l in b["lines"]:
            t = "".join(s["text"] for s in l["spans"])
            if t.startswith("Licensed to:") or "Licence ID" in t:
                page.add_redact_annot(fitz.Rect(l["bbox"]) + (-2, -1, 2, 1), fill=(1, 1, 1))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                          graphics=fitz.PDF_REDACT_LINE_ART_NONE)


def occupied(page, top, bottom):
    pr = page.rect
    rects = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] == 0:
            rects += [fitz.Rect(l["bbox"]) for l in b["lines"]]
    for im in page.get_image_info():
        r = fitz.Rect(im["bbox"])
        if r.width < 250 or r.height < 250:        # skip big background watermarks
            rects.append(r)
    for d in page.get_drawings():
        r = fitz.Rect(d["rect"])
        if r.get_area() < 0.6 * pr.get_area():
            rects.append(r)
    return rects


def find_slot(page, top, bottom, side=QR_SIZE):
    """Vectorised search on a 1pt occupancy grid (integral image)."""
    import numpy as np
    pr = page.rect
    W, H = int(pr.width), int(pr.height)
    occ = occupied(page, top, bottom)
    grid = np.zeros((H + 1, W + 1), dtype=np.int32)
    for r in occ:
        x0, y0 = max(int(r.x0), 0), max(int(r.y0), 0)
        x1, y1 = min(int(r.x1) + 1, W), min(int(r.y1) + 1, H)
        if x1 > x0 and y1 > y0:
            grid[y0:y1, x0:x1] = 1
    ii = np.zeros((H + 2, W + 2), dtype=np.int32)
    ii[1:, 1:] = grid.cumsum(0).cumsum(1)

    def hits(x0, y0, x1, y1):          # arrays of box corners -> occupied cell count
        x0 = np.clip(x0, 0, W); x1 = np.clip(x1, 0, W)
        y0 = np.clip(y0, 0, H); y1 = np.clip(y1, 0, H)
        return ii[y1, x1] - ii[y0, x1] - ii[y1, x0] + ii[y0, x0]

    body = [r for r in occ if top <= r.y0 and r.y1 <= bottom and r.width > 20]
    xmin = min((r.x0 for r in body), default=pr.x0)
    xmax = max((r.x1 for r in body), default=pr.x1)
    xs = np.arange(6, W - 6 - side, STEP)
    ys = np.arange(int(top), int(bottom - side), STEP)
    if len(xs) == 0 or len(ys) == 0:
        return None
    X, Y = np.meshgrid(xs, ys)
    free = hits(X - PAD, Y - PAD, X + side + PAD, Y + side + PAD) == 0
    if not free.any():
        return None
    clear = np.zeros(X.shape)
    alive = free.copy()
    for c in range(1, 13):
        alive &= hits(X - PAD - c, Y - PAD - c, X + side + PAD + c, Y + side + PAD + c) == 0
        clear += alive
    in_margin = (X + side <= xmin - 2) | (X >= xmax + 2)
    score = clear + 8 * in_margin + 0.001 * (X + Y)
    score[~free] = -1
    iy, ix = np.unravel_index(score.argmax(), score.shape)
    x, y = float(X[iy, ix]), float(Y[iy, ix])
    return fitz.Rect(x, y, x + side, y + side)


def draw_qr(page, rect, payload):
    q = segno.make(payload, error="m", micro=False)
    n = len(q.matrix)
    border = 1
    cell = rect.width / (n + 2 * border)
    page.draw_rect(rect, color=None, fill=(1, 1, 1))
    sh = page.new_shape()
    for r, row in enumerate(q.matrix):
        for c, v in enumerate(row):
            if v:
                x = rect.x0 + (c + border) * cell
                y = rect.y0 + (r + border) * cell
                sh.draw_rect(fitz.Rect(x, y, x + cell + 0.02, y + cell + 0.02))
    sh.finish(color=None, fill=(0, 0, 0))
    sh.commit()


def stamp(src, dst, buyer, profile, verify_base="https://vipulaw.in/v/", skip_pages=()):
    doc = fitz.open(src)
    n = len(doc)
    for i, page in enumerate(doc):
        if i in skip_pages:
            continue
        if profile == "footer":
            strip_old_stamp(page)
        font = fitz.Font(fontfile=FONT)
        page.insert_font(fontname="arial", fontfile=FONT)
        w = page.rect.width
        if profile == "header":
            text, size, y = line_text(buyer), 6.5, 11
            top, bottom = 22, page.rect.height - 40
        else:
            text, size, y = foot_text(buyer), 6.0, 767
            top, bottom = 80, 764
        tw = font.text_length(text, fontsize=size)
        page.insert_text(((w - tw) / 2, y), text, fontname="arial", fontsize=size, color=GREY)
        slot = find_slot(page, top, bottom)
        if slot is None:
            print(f"  page {i + 1}: NO FREE SPOT for QR", file=sys.stderr)
            continue
        draw_qr(page, slot, f"{verify_base}{buyer['licence']}-{i + 1}")
    doc.save(dst, garbage=4, deflate=True)
    doc.close()


if __name__ == "__main__":
    buyer = dict(name="Abhinav Yadav", mobile="+91 78604 87598",
                 email="abhinavyadav.bhu@gmail.com", licence="VL-UPESSC(8000)-7598")
    D = r"C:\Users\Welcome\OneDrive\Documents\Downloads"
    stamp(rf"{D}\Vipulaw_Jurisprudence_MCQs-1.pdf", "out/Jurisprudence_stamped.pdf", buyer, "header", skip_pages=(0,))
    stamp(rf"{D}\UPESSC_Law_Unit10_Environmental_Law_Practice_Book_Vipulaw-2.pdf",
          "out/Environmental_stamped.pdf", buyer, "footer", skip_pages=(0,))
