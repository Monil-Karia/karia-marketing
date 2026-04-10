// ============================================================
//  IMAGE PROCESSOR SCRIPT
//  Run this with: npm run process-images
//
//  What it does:
//  1. Reads every image from the /admin-uploads/ folder
//  2. Parses the filename: ProductName_Price_YES/NO_Qty.jpg
//  3. Resizes the image to 80×80 px
//  4. Uploads it to Supabase Storage
//  5. Creates a new product row in the database
//  6. Moves the processed image to /admin-uploads/done/ folder
//
//  Admin just drops the image file in — product appears on site!
// ============================================================

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables from .env.local
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for admin access
);

const UPLOADS_FOLDER = path.join(__dirname, "../admin-uploads");
const DONE_FOLDER = path.join(UPLOADS_FOLDER, "done");
const IMAGE_SIZE = 80; // px — change this in config.ts too if you want different size

// Make the 'done' folder if it doesn't exist
if (!fs.existsSync(DONE_FOLDER)) {
  fs.mkdirSync(DONE_FOLDER, { recursive: true });
}

// ── Parse the filename into product data ──────────────────────
// Expected format: ProductName_Price_YES_Qty.jpg
// Example: NeckMassagerPro_1499_YES_25.jpg
function parseFilename(filename) {
  // Remove the file extension (.jpg, .png, etc.)
  const nameWithoutExt = path.parse(filename).name;
  const parts = nameWithoutExt.split("_");

  if (parts.length < 4) {
    console.error(`  ✗ Filename format wrong: "${filename}"`);
    console.error(`    Expected: ProductName_Price_YES_Qty.jpg`);
    return null;
  }

  // Last 3 parts are fixed: price, returnable, qty
  // Everything before them is the product name
  const qty = parseInt(parts[parts.length - 1]);
  const returnable = parts[parts.length - 2].toUpperCase() === "YES";
  const price = parseInt(parts[parts.length - 3]);
  const productNameRaw = parts.slice(0, parts.length - 3).join(" ");

  if (isNaN(price) || isNaN(qty)) {
    console.error(`  ✗ Price or quantity is not a number in: "${filename}"`);
    return null;
  }

  return {
    name: productNameRaw,
    price,
    quantity: qty,
    is_returnable: returnable,
  };
}

// ── Main processing function ──────────────────────────────────
async function processImages() {
  const files = fs.readdirSync(UPLOADS_FOLDER).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
  });

  if (files.length === 0) {
    console.log("No new images found in admin-uploads/");
    return;
  }

  console.log(`Found ${files.length} image(s) to process...\n`);

  for (const file of files) {
    console.log(`Processing: ${file}`);
    const filePath = path.join(UPLOADS_FOLDER, file);

    // Step 1: Parse the filename
    const productData = parseFilename(file);
    if (!productData) {
      console.log(`  → Skipped (bad filename)\n`);
      continue;
    }

    try {
      // Step 2: Resize to 80×80 px using sharp
      const resizedBuffer = await sharp(filePath)
        .resize(IMAGE_SIZE, IMAGE_SIZE, {
          fit: "contain",        // Don't crop, fit inside the box
          background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Step 3: Upload to Supabase Storage
      const storagePath = `products/${Date.now()}_${path.parse(file).name}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("product-images") // Your Supabase bucket name
        .upload(storagePath, resizedBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.error(`  ✗ Upload failed: ${uploadError.message}`);
        continue;
      }

      // Step 4: Get the public URL of the uploaded image
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(storagePath);

      const imageUrl = urlData.publicUrl;

      // Step 5: Insert product into database
      const { error: dbError } = await supabase.from("products").insert({
        name: productData.name,
        price: productData.price,
        quantity: productData.quantity,
        is_returnable: productData.is_returnable,
        image_url: imageUrl,
        category: "Other", // Default category — admin can change in dashboard
        is_active: true,
      });

      if (dbError) {
        console.error(`  ✗ Database insert failed: ${dbError.message}`);
        continue;
      }

      // Step 6: Move original file to 'done' folder
      const donePath = path.join(DONE_FOLDER, file);
      fs.renameSync(filePath, donePath);

      console.log(`  ✓ "${productData.name}" — ₹${productData.price} — Qty: ${productData.quantity}`);
      console.log(`  → Image uploaded, product listed!\n`);
    } catch (err) {
      console.error(`  ✗ Error processing ${file}:`, err.message);
    }
  }

  console.log("Done! Check your website — new products should be live.");
}

processImages();