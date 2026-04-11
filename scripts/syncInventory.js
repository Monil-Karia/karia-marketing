// ============================================================
//  INVENTORY SYNC SCRIPT — Mac Compatible (CSV)
//  
//  COMMANDS:
//  npm run init-inventory  → pulls all products from DB, creates inventory.csv
//  npm run sync-inventory  → reads inventory.csv, pushes quantity changes to DB
//
//  WHERE IS THE FILE?
//  inventory.csv lives in the ROOT of your project folder
//  (same level as package.json)
//
//  HOW ADMIN USES IT:
//  1. Run: npm run init-inventory  (creates the file first time)
//  2. Open inventory.csv with Mac Numbers or drag into Google Sheets
//  3. Change the 'quantity' column for any product
//  4. Save the file
//  5. Run: npm run sync-inventory
//  6. Website updates immediately
// ============================================================

const fs   = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const CSV_PATH = path.join(__dirname, "../inventory.csv");

// ── Escape a value for CSV ────────────────────────────────────
function csvCell(val) {
  const str = String(val ?? "");
  // Wrap in quotes if it contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ── Parse a CSV line respecting quoted fields ─────────────────
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ── INIT: Pull from DB → write CSV ───────────────────────────
async function initInventory() {
  console.log("\n📦 Fetching products from database...\n");

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("category")
    .order("name");

  if (error) {
    console.error("❌ Database error:", error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log("⚠️  No products found in database.");
    console.log("   Add products first via the admin panel, then run this again.");
    return;
  }

  // Build CSV rows
  const header = [
    "product_id",
    "name",
    "category",
    "price",
    "quantity",
    "is_returnable",
    "status",
    "last_updated",
  ].join(",");

  const rows = products.map((p) => {
    return [
      csvCell(p.id),
      csvCell(p.name),
      csvCell(p.category),
      csvCell(p.price),
      csvCell(p.quantity),
      csvCell(p.is_returnable ? "YES" : "NO"),
      csvCell(p.quantity === 0 ? "OUT OF STOCK" : "IN STOCK"),
      csvCell(new Date().toLocaleString("en-IN")),
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  fs.writeFileSync(CSV_PATH, csv, "utf-8");

  console.log(`✅ inventory.csv created with ${products.length} products`);
  console.log(`📂 File location: ${CSV_PATH}`);
  console.log("\n─────────────────────────────────────────");
  console.log("HOW TO USE:");
  console.log("  1. Open inventory.csv in Mac Numbers or Google Sheets");
  console.log("  2. Only change the 'quantity' column");
  console.log("  3. Save the file");
  console.log("  4. Run: npm run sync-inventory");
  console.log("─────────────────────────────────────────\n");
}

// ── SYNC: Read CSV → push to DB ───────────────────────────────
async function syncInventory() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error("❌ inventory.csv not found.");
    console.error("   Run this first: npm run init-inventory");
    process.exit(1);
  }

  console.log("\n🔄 Reading inventory.csv...\n");

  const content = fs.readFileSync(CSV_PATH, "utf-8");
  const lines   = content.trim().split("\n");

  if (lines.length < 2) {
    console.error("❌ CSV file is empty or has no data rows.");
    process.exit(1);
  }

  // First line is header — skip it
  const dataLines = lines.slice(1).filter((l) => l.trim() !== "");

  console.log(`Found ${dataLines.length} products in CSV.\n`);

  let updated = 0;
  let skipped = 0;
  let errors  = 0;

  for (const line of dataLines) {
    const cols = parseCSVLine(line);

    const productId = cols[0];
    const name      = cols[1];
    const quantity  = parseInt(cols[4]);

    if (!productId || productId.length < 10) {
      console.log(`  ⚠️  Skipped row — missing product_id`);
      skipped++;
      continue;
    }

    if (isNaN(quantity) || quantity < 0) {
      console.log(`  ⚠️  Skipped "${name}" — invalid quantity "${cols[4]}"`);
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from("products")
      .update({
        quantity,
        is_active: quantity > 0,
      })
      .eq("id", productId);

    if (error) {
      console.error(`  ❌ Failed to update "${name}": ${error.message}`);
      errors++;
    } else {
      const tag = quantity === 0 ? " ← OUT OF STOCK" : quantity <= 3 ? " ← LOW STOCK" : "";
      console.log(`  ✅ ${name.padEnd(30)} qty: ${quantity}${tag}`);
      updated++;
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`✅ Updated:  ${updated}`);
  console.log(`⚠️  Skipped:  ${skipped}`);
  console.log(`❌ Errors:   ${errors}`);
  console.log("─────────────────────────────────────────");

  // Refresh CSV to show updated status and timestamp
  console.log("\n🔄 Refreshing CSV with latest data...");
  await initInventory();
}

// ── Run based on argument ─────────────────────────────────────
const command = process.argv[2];

if (command === "init") {
  initInventory();
} else if (command === "sync") {
  syncInventory();
} else {
  console.log("\nUsage:");
  console.log("  npm run init-inventory   → Create CSV from database");
  console.log("  npm run sync-inventory   → Push CSV changes to database\n");
}