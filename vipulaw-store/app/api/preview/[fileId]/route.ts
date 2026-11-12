import { db } from "@/lib/db";
import { getFile } from "@/lib/storage";

/** Serves only the pre-cut preview (first pages) of published products. The original is never reachable here. */
export async function GET(_: Request, ctx: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await ctx.params;
  const file = await db.productFile.findFirst({
    where: { id: fileId, product: { status: "PUBLISHED" } },
    select: { previewKey: true },
  });
  if (!file) return new Response("Not found", { status: 404 });
  const bytes = await getFile("preview", file.previewKey);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="preview.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
