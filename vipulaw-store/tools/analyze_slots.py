"""Upload-time PDF analysis: for each page, find the emptiest spot for a small QR.

Usage: python analyze_slots.py <pdf> <HEADER|FOOTER>
Prints JSON: {"pageCount": n, "slots": [{"x","y","size","w","h"} | null, ...]}
Coordinates are PyMuPDF top-left points. The web app converts them when stamping.
"""
import json
import sys

import numpy as np
import pymupdf as fitz

QR_SIZE = 30
PAD = 3
STEP = 2


def occupied(page):
    pr = page.rect
    rects = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] == 0:
            rects += [fitz.Rect(l["bbox"]) for l in b["lines"]]
    for im in page.get_image_info():
        r = fitz.Rect(im["bbox"])
        if r.width < 250 or r.height < 250:  # ignore big background watermarks
            rects.append(r)
    for d in page.get_drawings():
        r = fitz.Rect(d["rect"])
        if r.get_area() < 0.6 * pr.get_area():
            rects.append(r)
    return rects


def find_slot(page, top, bottom, side=QR_SIZE):
    pr = page.rect
    W, H = int(pr.width), int(pr.height)
    occ = occupied(page)
    grid = np.zeros((H + 1, W + 1), dtype=np.int32)
    for r in occ:
        x0, y0 = max(int(r.x0), 0), max(int(r.y0), 0)
        x1, y1 = min(int(r.x1) + 1, W), min(int(r.y1) + 1, H)
        if x1 > x0 and y1 > y0:
            grid[y0:y1, x0:x1] = 1
    ii = np.zeros((H + 2, W + 2), dtype=np.int32)
    ii[1:, 1:] = grid.cumsum(0).cumsum(1)

    def hits(x0, y0, x1, y1):
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
    return {"x": float(X[iy, ix]), "y": float(Y[iy, ix]), "size": side, "w": float(pr.width), "h": float(pr.height)}


def main():
    path, profile = sys.argv[1], sys.argv[2]
    doc = fitz.open(path)
    slots = []
    for i, page in enumerate(doc):
        if i == 0:  # cover page is left unstamped
            slots.append(None)
            continue
        if profile == "FOOTER":
            top, bottom = 80, 764
        else:
            top, bottom = 22, page.rect.height - 40
        slots.append(find_slot(page, top, bottom))
    print(json.dumps({"pageCount": len(doc), "slots": slots}))


if __name__ == "__main__":
    main()
