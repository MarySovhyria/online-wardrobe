import { createClient } from "@supabase/supabase-js";
import { createExtractionHandler } from "@/lib/extraction-handler";
import { runLocalExtraction } from "@/lib/local-extraction";

export const runtime = "nodejs";
export const maxDuration = 240;
export const POST = createExtractionHandler({
  async verifyUser(token) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("missing_config");
    const client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const { data, error } = await client.auth.getUser(token);
    return error ? null : (data.user?.id ?? null);
  },
  extract: runLocalExtraction,
});
