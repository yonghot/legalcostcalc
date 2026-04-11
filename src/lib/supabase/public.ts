import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Public (cookieless) Supabase client for read-only access to public data.
 *
 * Why this exists separately from the @supabase/ssr createServerClient:
 * calling `cookies()` from `next/headers` — which the SSR client requires —
 * opts the calling route out of static generation. For LegalCostCalc's 400+
 * SEO landing pages this is catastrophic: the whole point of
 * `generateStaticParams` is to pre-render them at build time, but a single
 * `cookies()` call anywhere in the render tree makes Next.js treat the route
 * as dynamic (ƒ).
 *
 * This app has no user authentication — all data in `legal_costs` is public —
 * so there is no reason to pay the dynamic-rendering cost. Routes that need
 * auth in the future should use @supabase/ssr directly; data-reading paths
 * should keep using this client.
 */
function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }
  return { url, key };
}

let cachedClient: SupabaseClient | null = null;

export function getPublicSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const { url, key } = getSupabaseEnv();
  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cachedClient;
}
