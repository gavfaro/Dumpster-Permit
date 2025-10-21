import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Note: These variables are loaded from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase URL or Anon Key is missing from environment variables."
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
};
