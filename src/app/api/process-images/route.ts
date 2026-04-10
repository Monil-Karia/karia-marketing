// ============================================================
//  API: /api/process-images
//  POST → triggers the image processor for files in admin-uploads/
//  This lets admin trigger processing without opening a terminal.
//  Called from the admin dashboard button.
// ============================================================

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Image processing inline (so it works as an API route)
export async function POST() {
  try {
    // Dynamic import of sharp (server-side only)
    const sharp = (await import("sharp")).default;

    const uploadsFolder = path.join(process.cwd(), "admin-uploads");
    const doneFolder = path.join(uploadsFolder, "done");

    if (!fs.existsSync(uploadsFolder)) {
      return NextResponse.json({ message: "admin-uploads folder not found" }, { status: 404 });
    }

    if (!fs.existsSync(doneFolder)) {
      fs.mkdirSync(doneFolder, { recursive: true });
    }

    const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const files = fs.readdirSync(uploadsFolder).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return validExtensions.includes(ext);
    });

    if (files.length === 0) {
      return NextResponse.json({ message: "No new images found", processed: 0 });
    }

    const results: { name: string; status: string }[] = [];

    for (const file of files) {
      const filePath = path.join(uploadsFolder, file);
      const parsed = parseFilename(file);

      if (!parsed) {
        results.push({ name: file, status: "skipped — bad filename format" });
        continue;
      }

      try {
        const resizedBuffer = await sharp(filePath)
          .resize(80, 80, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .jpeg({ quality: 85 })
          .toBuffer();

        const storagePath = `products/${Date.now()}_${path.parse(file).name}.jpg`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("product-images")
          .upload(storagePath, resizedBuffer, { contentType: "image/jpeg" });

        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = supabaseAdmin.storage
          .from("product-images")
          .getPublicUrl(storagePath);

        const { error: dbError } = await supabaseAdmin.from("products").insert({
          name: parsed.name,
          price: parsed.price,
          quantity: parsed.quantity,
          is_returnable: parsed.is_returnable,
          image_url: urlData.publicUrl,
          category: "Other",
          is_active: true,
        });

        if (dbError) throw new Error(dbError.message);

        fs.renameSync(filePath, path.join(doneFolder, file));
        results.push({ name: parsed.name, status: "listed successfully" });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({ name: file, status: `error — ${message}` });
      }
    }

    return NextResponse.json({
      message: `Processed ${files.length} image(s)`,
      processed: results.filter((r) => r.status.includes("successfully")).length,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseFilename(filename: string) {
  const nameWithoutExt = path.parse(filename).name;
  const parts = nameWithoutExt.split("_");
  if (parts.length < 4) return null;

  const qty = parseInt(parts[parts.length - 1]);
  const returnable = parts[parts.length - 2].toUpperCase() === "YES";
  const price = parseInt(parts[parts.length - 3]);
  const productName = parts.slice(0, parts.length - 3).join(" ");

  if (isNaN(price) || isNaN(qty)) return null;

  return { name: productName, price, quantity: qty, is_returnable: returnable };
}
