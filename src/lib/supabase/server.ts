import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getServerSupabaseConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  // Prefer SUPABASE_SERVICE_ROLE_KEY on the server for full admin access, otherwise fall back to anon key
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  const isConfigured = Boolean(
    url &&
    serviceKey &&
    !url.includes('placeholder') &&
    url.startsWith('https://')
  );

  return { url, serviceKey, isConfigured };
}

let serverClientInstance: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (serverClientInstance) return serverClientInstance;

  const { url, serviceKey, isConfigured } = getServerSupabaseConfig();
  if (!isConfigured) {
    return null;
  }

  try {
    serverClientInstance = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return serverClientInstance;
  } catch (err) {
    console.warn('Gagal menginisialisasi server client Supabase:', err);
    return null;
  }
}

export const isServerSupabaseConfigured = (): boolean => {
  return getServerSupabaseConfig().isConfigured;
};
