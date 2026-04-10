// ============================================================
//  INVENTORY SYNC SCRIPT — Mac Compatible (CSV version)
//  Creates inventory.csv instead of .xlsx
//  Opens in Mac Numbers, Google Sheets, or Excel
//
//  npm run init-inventory  → pull from DB, create CSV
//  npm run sync-inventory  → push CSV changes to DB
// ============================================================

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const CSV_PATH = path.join(__dirname, "../inventory.csv");

// ── INIT: Pull from DB → create CSV ──────────────────────────
async function initInventory() {
  console.log("Fetching products from database...");

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("category")
    .order("name");

  if (error) { console.error("Error:", error.message); process.exit(1); }

  console.log(`Found ${products.length} products. Creating inventory.csv...`);

  const header = "product_id,name,category,price,quantity,is_returnable,status,last_updated";

  const rows = products.map((p) => {
    const status = p.quantity === 0 ? "OUT OF STOCK" : "IN STOCK";
    const updated = new Date()?.toLocaleString("en-IN") ?? "0";
    // Wrap name in quotes in case it has commas
    return `${p.id},"${p.name}",${p.category},${p.price},${p.quantity},${p.is_returnable ? "YES" : "NO"},${status},"${updated}"`;
  });

  const csv = [header, ...rows].join("\n");
  fs.writeFileSync(CSV_PATH, csv);

  console.log(`\n✓ inventory.csv created!`);
  console.log(`  Open it with: open inventory.csv`);
  console.log(`  Or drag it into Google Sheets / Mac Numbers`);
  console.log(`\n  IMPORTANT: Only edit the 'quantity' column.`);
  console.log(`  Save the file, then run: npm run sync-inventory`);
}

// ── SYNC: Read CSV → push changes to DB ──────────────────────
async function syncInventory() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error("inventory.csv not found. Run: npm run init-inventory first.");
    process.exit(1);
  }

  console.log("Reading inventory.csv...");
  const content = fs.readFileSync(CSV_PATH, "utf-8");
  const lines = content.trim().split("\n");

  // Skip header row
  const rows = lines.slice(1).map((line) => {
    // Handle quoted fields
    const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    return {
      product_id: cols[0]?.replace(/"/g, "").trim(),
      name:       cols[1]?.replace(/"/g, "").trim(),
      quantity:   parseInt(cols[4]) || 0,
    };
  });

  console.log(`Found ${rows.length} products. Syncing...`);
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    if (!row.product_id) continue;

    const { error } = await supabase
      .from("products")
      .update({
        quantity: row.quantity,
        is_active: row.quantity > 0,
      })
      .eq("id", row.product_id);

    if (error) {
      console.error(`  ✗ Failed: ${row.name} — ${error.message}`);
      errors++;
    } else {
      console.log(`  ✓ ${row.name} → qty: ${row.quantity}${row.quantity === 0 ? " (OUT OF STOCK)" : ""}`);
      updated++;
    }
  }

  // Refresh the CSV with latest status
  await initInventory();
  console.log(`\nDone! ${updated} updated, ${errors} errors.`);
}

const command = process.argv[2];
if (command === "init") initInventory();
else if (command === "sync") syncInventory();
else {
  console.log("Usage:");
  console.log("  npm run init-inventory   → Create CSV from database");
  console.log("  npm run sync-inventory   → Push CSV changes to database");
}