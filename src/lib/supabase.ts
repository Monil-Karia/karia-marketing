// ============================================================
//  SUPABASE CLIENT
//  This file connects your website to the database.
//  You never need to edit this — it reads from .env.local
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Used in browser — customer facing pages
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
