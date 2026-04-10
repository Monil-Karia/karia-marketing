// ============================================================
//  AUTO WATCHER SCRIPT
//  File: scripts/watchUploads.js
//  Run with: npm run watch-uploads
//
//  Watches the admin-uploads/ folder.
//  The moment admin drops an image in → it auto-processes it.
//  Admin needs to do NOTHING except drop the file in.
//
//  Run this in a separate terminal while the dev server is running:
//    Terminal 1: npm run dev
//    Terminal 2: npm run watch-uploads
//
//  On the live server (Netlify) this won't work — use the
//  "Process New Images" button in the admin dashboard instead.
// ============================================================

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const UPLOADS_FOLDER = path.join(__dirname, "../admin-uploads");
const DONE_FOLDER = path.join(UPLOADS_FOLDER, "done");
const VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

if (!fs.existsSync(DONE_FOLDER)) {
  fs.mkdirSync(DONE_FOLDER, { recursive: true });
}

function parseFilename(filename) {
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

async function processFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (!VALID_EXTENSIONS.includes(ext)) return;

  const filePath = path.join(UPLOADS_FOLDER, filename);

  // Wait briefly to ensure the file is fully written
  await new Promise((r) => setTimeout(r, 500));

  const parsed = parseFilename(filename);
  if (!parsed) {
    console.log(`⚠️  Bad filename: "${filename}" — skipping`);
    console.log(`   Expected format: ProductName_Price_YES_Quantity.jpg`);
    return;
  }

  console.log(`\n🔄 Processing: ${filename}`);

  try {
    const resizedBuffer = await sharp(filePath)
      .resize(80, 80, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const storagePath = `products/${Date.now()}_${path.parse(filename).name}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, resizedBuffer, { contentType: "image/jpeg" });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(storagePath);

    const { error: dbError } = await supabase.from("products").insert({
      name: parsed.name,
      price: parsed.price,
      quantity: parsed.quantity,
      is_returnable: parsed.is_returnable,
      image_url: urlData.publicUrl,
      category: "Other",
      is_active: true,
    });

    if (dbError) throw new Error(`DB insert failed: ${dbError.message}`);

    fs.renameSync(filePath, path.join(DONE_FOLDER, filename));

    console.log(`✅ "${parsed.name}" listed! ₹${parsed.price} · Qty: ${parsed.quantity}`);
    console.log(`   Returnable: ${parsed.is_returnable ? "Yes" : "No"}`);
    console.log(`   → Check http://localhost:3000 to see it live`);
  } catch (err) {
    console.error(`❌ Error:`, err.message);
  }
}

// Start watching
console.log(`👀 Watching admin-uploads/ for new images...`);
console.log(`   Drop a file like "NeckMassager_1499_YES_25.jpg" in the folder`);
console.log(`   It will be processed and listed automatically!\n`);

fs.watch(UPLOADS_FOLDER, (eventType, filename) => {
  if (filename && eventType === "rename") {
    const filePath = path.join(UPLOADS_FOLDER, filename);
    // Only process if the file now exists (rename fires on both add and delete)
    if (fs.existsSync(filePath)) {
      processFile(filename);
    }
  }
});