import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Test if backend can communicate w/ supabase DB
 * Returns an object with `ok` and `error`
 */
export async function testSupabaseConnection() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      error: new Error("Missing Supabase environment configuration."),
    };
  }

  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      return { ok: false, error };
    }

    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err };
  }
}
