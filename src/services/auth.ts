import { AuthUser } from '../types';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '../lib/supabase/client';

const STORAGE_KEY_AUTH = 'antrean_kantin_auth_user';

// Helper to convert plain username to standard email format if needed
export function formatEmailFromInput(input: string): string {
  const clean = input.trim().toLowerCase();
  if (clean.includes('@')) {
    return clean;
  }
  return `${clean}@kantin.santri`;
}

export const authService = {
  // Login menggunakan Supabase Auth dan baca role dari profiles
  async login(identifier: string, password: string): Promise<AuthUser> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      throw new Error('Masukkan email/username dan password!');
    }

    const supabase = getSupabaseBrowserClient();

    // 1. Jika Supabase dikonfigurasi, gunakan Supabase Auth resmi
    if (supabase && isSupabaseConfigured()) {
      let email = formatEmailFromInput(cleanId);

      // Coba cari email dari tabel profiles jika user memasukkan username
      if (!cleanId.includes('@')) {
        try {
          const { data: profileByUsername } = await supabase
            .from('profiles')
            .select('auth_user_id, username')
            .eq('username', cleanId)
            .maybeSingle();

          if (profileByUsername?.username) {
            email = `${profileByUsername.username}@kantin.santri`;
          }
        } catch (e) {
          console.warn('Profile username lookup notice:', e);
        }
      }

      // Autentikasi ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: cleanPass,
      });

      if (authError) {
        throw new Error(authError.message || 'Login gagal. Periksa kembali email dan password Anda.');
      }

      if (!authData.user) {
        throw new Error('Pengguna tidak ditemukan dalam sistem Supabase Auth.');
      }

      const authUserId = authData.user.id;
      let userRole: 'admin' | 'kasir' | 'dapur' | 'santri' = 'santri';
      let fullName = cleanId;

      // Baca role dari tabel profiles di Supabase PostgreSQL
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name, username')
          .or(`auth_user_id.eq.${authUserId},id.eq.${authUserId}`)
          .maybeSingle();

        if (profile) {
          userRole = profile.role as 'admin' | 'kasir' | 'dapur' | 'santri';
          fullName = profile.full_name || profile.username || cleanId;
        } else if (authData.user.user_metadata?.role) {
          userRole = authData.user.user_metadata.role;
          fullName = authData.user.user_metadata.full_name || cleanId;
        } else {
          // Buat profile default jika belum ada
          const defaultRole = cleanId.includes('dapur')
            ? 'dapur'
            : cleanId.includes('kasir')
            ? 'kasir'
            : cleanId.includes('admin')
            ? 'admin'
            : 'santri';
          userRole = defaultRole;
          fullName = cleanId.toUpperCase();

          await supabase.from('profiles').upsert({
            auth_user_id: authUserId,
            username: cleanId.replace('@kantin.santri', ''),
            full_name: fullName,
            role: defaultRole,
          });
        }
      } catch (err) {
        console.warn('Profile read exception, using auth metadata:', err);
      }

      const authenticatedUser: AuthUser = {
        id: authUserId,
        email: authData.user.email,
        username: cleanId.replace('@kantin.santri', ''),
        role: userRole,
        name: fullName,
        token: authData.session?.access_token || `token-${Date.now()}`,
      };

      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(authenticatedUser));
      } catch (e) {
        console.warn(e);
      }

      return authenticatedUser;
    }

    // 2. Fallback Mode Lokal / Offline (Saat Supabase belum dikonfigurasi)
    const role: 'admin' | 'kasir' | 'dapur' | 'santri' =
      cleanId.includes('dapur')
        ? 'dapur'
        : cleanId.includes('kasir')
        ? 'kasir'
        : cleanId.includes('admin')
        ? 'admin'
        : 'santri';

    const localUser: AuthUser = {
      username: cleanId.replace('@kantin.santri', ''),
      role,
      name:
        role === 'admin'
          ? 'Administrator Kantin'
          : role === 'kasir'
          ? 'Petugas Kasir'
          : role === 'dapur'
          ? 'Petugas Dapur Kantin'
          : 'Santri',
      token: `local-token-${Date.now()}`,
    };

    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(localUser));
    } catch (e) {
      console.warn(e);
    }

    return localUser;
  },

  // Logout dari Supabase Auth
  async logout(): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch (e) {
      console.warn(e);
    }
  },

  // Ambil user yang tersimpan di sesi lokal
  getSavedUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUTH);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
};
