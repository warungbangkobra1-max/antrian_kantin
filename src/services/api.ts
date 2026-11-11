import { QueueItem, QueueStats, AuthUser } from '../types';

const API_BASE = '/api';

export interface ServerState {
  queues: QueueItem[];
  stats: QueueStats;
  isOnline: boolean;
  lastSyncTime: number;
}

export const api = {
  // Check backend health
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Fetch all queues
  async getQueues(): Promise<{ queues: QueueItem[]; stats: QueueStats }> {
    const res = await fetch(`${API_BASE}/queues`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Gagal memuat antrean (${res.status})`);
    }
    return res.json();
  },

  // Login kasir/admin
  async login(username: string, password: string): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login gagal');
    }
    return data.user;
  },

  // Create queue (Santri / Kasir)
  async createQueue(number: string, name: string, operator?: string, counter?: string): Promise<QueueItem> {
    const res = await fetch(`${API_BASE}/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number, name, operator, counter }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal menambahkan antrean');
    }
    return data.item;
  },

  // Panggil antrean
  async callQueue(id: string, operator?: string, counter?: string): Promise<QueueItem> {
    const res = await fetch(`${API_BASE}/queues/${id}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, counter }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal memanggil antrean');
    }
    return data.item;
  },

  // Panggil ulang
  async recallQueue(id: string, operator?: string): Promise<QueueItem> {
    const res = await fetch(`${API_BASE}/queues/${id}/recall`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal memanggil ulang');
    }
    return data.item;
  },

  // Selesai antrean
  async completeQueue(id: string, operator?: string): Promise<QueueItem> {
    const res = await fetch(`${API_BASE}/queues/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal menyelesaikan antrean');
    }
    return data.item;
  },

  // Lewati antrean
  async skipQueue(id: string, operator?: string): Promise<QueueItem> {
    const res = await fetch(`${API_BASE}/queues/${id}/skip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal melewati antrean');
    }
    return data.item;
  },

  // Batalkan antrean (Admin)
  async cancelQueue(id: string, operator?: string): Promise<QueueItem> {
    const res = await fetch(`${API_BASE}/queues/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal membatalkan antrean');
    }
    return data.item;
  },

  // Hapus antrean yang salah (Admin)
  async deleteQueue(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/queues/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal menghapus antrean');
    }
  },

  // Reset semua antrean hari ini (Admin)
  async resetQueues(): Promise<void> {
    const res = await fetch(`${API_BASE}/queues/reset`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal me-reset antrean');
    }
  },

  // Verifikasi PIN Petugas (Kasir & Admin) aman via server-side
  async verifyPin(pin: string): Promise<{ success: boolean; role: 'kasir' | 'admin'; user: AuthUser }> {
    const res = await fetch(`${API_BASE}/auth/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'PIN salah!');
    }
    return data;
  },
};
