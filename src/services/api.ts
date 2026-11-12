import { QueueItem, QueueStats, AuthUser, ProductItem } from '../types';

const API_BASE = '/api';

export interface HealthStatus {
  online: boolean;
  cloudDb: boolean;
  database: string;
}

export const api = {
  // Check backend health & database connection
  async checkHealth(): Promise<HealthStatus> {
    try {
      const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
      if (!res.ok) return { online: false, cloudDb: false, database: 'offline' };
      const data = await res.json();
      return {
        online: true,
        cloudDb: Boolean(data.cloudDb),
        database: data.database || 'local_storage',
      };
    } catch {
      return { online: false, cloudDb: false, database: 'offline' };
    }
  },

  // Fetch all products / menu
  async getProducts(): Promise<ProductItem[]> {
    try {
      const res = await fetch(`${API_BASE}/products`, { cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      return data.products || [];
    } catch {
      return [];
    }
  },

  // Fetch all queues
  async getQueues(): Promise<{ queues: QueueItem[]; stats: QueueStats; cloudDb: boolean }> {
    const res = await fetch(`${API_BASE}/queues`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Gagal memuat antrean (${res.status})`);
    }
    return res.json();
  },

  // Login kasir/dapur/admin
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

  // Verifikasi PIN Petugas (Kasir, Dapur, & Admin) via server-side
  async verifyPin(pin: string): Promise<{ success: boolean; role: 'kasir' | 'dapur' | 'admin'; user: AuthUser }> {
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

  // Create queue (Santri / Kasir)
  async createQueue(payload: {
    number: string;
    name: string;
    classRoom?: string;
    items?: any[];
    totalAmount?: number;
    notes?: string;
    operator?: string;
    counter?: string;
    clientId?: string;
  }): Promise<QueueItem> {
    const res = await fetch(`${API_BASE}/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal menambahkan antrean');
    }
    return data.item;
  },

  // Batch sync offline queued items
  async syncOfflineQueues(offlineItems: QueueItem[]): Promise<{ success: boolean; syncedCount: number }> {
    const res = await fetch(`${API_BASE}/queues/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offlineItems }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal sinkronisasi offline');
    }
    return data;
  },

  // Panggil antrean (Kasir)
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

  // Panggil ulang (Kasir)
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

  // Proses pesanan (Dapur)
  async processQueue(id: string): Promise<QueueItem> {
    const res = await fetch(`${API_BASE}/queues/${id}/process`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal memproses antrean');
    }
    return data.item;
  },

  // Pesanan siap diambil (Dapur)
  async readyQueue(id: string): Promise<QueueItem> {
    const res = await fetch(`${API_BASE}/queues/${id}/ready`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal mengubah status antrean siap');
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
};
