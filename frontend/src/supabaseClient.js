// frontend/src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, "") || "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export default supabase;