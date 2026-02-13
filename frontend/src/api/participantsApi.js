// src/api/participantsApi.js
import { supabase } from "../supabaseClient";

/**
 * Load public participant rows used for the readiness score.
 * Requires RLS policy that allows anon SELECT of needed columns.
 */
export async function loadParticipants({ limit = 5000 } = {}) {
  // Only fetch the small set of columns we actually need client-side
  const { data, error } = await supabase
    .from("participants")
    .select("state,wants_class_action", { head: false })
    .limit(limit);

  if (error) {
    // Surface a concise error so UI can show a friendly message
    throw new Error(`[participants] ${error.message}`);
  }
  return Array.isArray(data) ? data : [];
}