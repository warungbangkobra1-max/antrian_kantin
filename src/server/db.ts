import fs from 'fs';
import path from 'path';
import { QueueItem, QueueStats } from '../types';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '../lib/supabase/server';

// Format date helpers (Indonesian local format YYYY-MM-DD and HH:mm)
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTimeString(timestamp?: number): string {
  const d = timestamp ? new Date(timestamp) : new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

const todayStr = getTodayDateString();
const now = Date.now();

export const INITIAL_DATA: QueueItem[] = [
  {
    id: 'q-020',
    number: 'A020',
    name: 'Faris',
    classRoom: 'Kelas 3A',
    date: todayStr,
    createdAt: now - 1000 * 60 * 45,
    jamMasuk: '07:05',
    calledAt: now - 1000 * 60 * 38,
    jamDipanggil: '07:12',
    completedAt: now - 1000 * 60 * 35,
    jamSelesai: '07:15',
    status: 'Selesai',
    operator: 'Kasir 1',
    counter: 'Loket 1',
    callCount: 1,
    waitingDurationMinutes: 7,
    serviceDurationMinutes: 3,
    totalAmount: 15000,
  },
  {
    id: 'q-021',
    number: 'A021',
    name: 'Hasan',
    classRoom: 'Kelas 2B',
    date: todayStr,
    createdAt: now - 1000 * 60 * 40,
    jamMasuk: '07:10',
    calledAt: now - 1000 * 60 * 33,
    jamDipanggil: '07:17',
    completedAt: now - 1000 * 60 * 29,
    jamSelesai: '07:21',
    status: 'Selesai',
    operator: 'Kasir 1',
    counter: 'Loket 1',
    callCount: 1,
    waitingDurationMinutes: 7,
    serviceDurationMinutes: 4,
    totalAmount: 12000,
  },
  {
    id: 'q-022',
    number: 'A022',
    name: 'Umar',
    classRoom: 'Kelas 1A',
    date: todayStr,
    createdAt: now - 1000 * 60 * 35,
    jamMasuk: '07:15',
    calledAt: now - 1000 * 60 * 27,
    jamDipanggil: '07:23',
    completedAt: null,
    jamSelesai: null,
    status: 'Dilewati',
    operator: 'Kasir 1',
    counter: 'Loket 1',
    callCount: 2,
    waitingDurationMinutes: 8,
    serviceDurationMinutes: 0,
    totalAmount: 10000,
  },
  {
    id: 'q-023',
    number: 'A023',
    name: 'Zaki',
    classRoom: 'Kamar Abu Bakar',
    date: todayStr,
    createdAt: now - 1000 * 60 * 30,
    jamMasuk: '07:20',
    calledAt: null,
    jamDipanggil: null,
    completedAt: null,
    jamSelesai: null,
    status: 'Dibatalkan',
    operator: 'Kasir 1',
    counter: 'Loket 1',
    callCount: 0,
    waitingDurationMinutes: 0,
    serviceDurationMinutes: 0,
    totalAmount: 0,
  },
  {
    id: 'q-025',
    number: 'A025',
    name: 'Ahmad',
    classRoom: 'Kelas 3B',
    date: todayStr,
    createdAt: now - 1000 * 60 * 15,
    jamMasuk: '07:35',
    calledAt: null,
    jamDipanggil: null,
    completedAt: null,
    jamSelesai: null,
    status: 'Menunggu',
    operator: 'Kasir 1',
    counter: 'Loket 1',
    callCount: 0,
    totalAmount: 13000,
  },
  {
    id: 'q-026',
    number: 'A026',
    name: 'Budi',
    classRoom: 'Kelas 2A',
    date: todayStr,
    createdAt: now - 1000 * 60 * 12,
    jamMasuk: '07:38',
    calledAt: null,
    jamDipanggil: null,
    completedAt: null,
    jamSelesai: null,
    status: 'Menunggu',
    operator: 'Kasir 1',
    counter: 'Loket 1',
    callCount: 0,
    totalAmount: 8000,
  },
  {
    id: 'q-027',
    number: 'A027',
    name: 'Rian',
    classRoom: 'Kamar Utsman',
    date: todayStr,
    createdAt: now - 1000 * 60 * 8,
    jamMasuk: '07:42',
    calledAt: null,
    jamDipanggil: null,
    completedAt: null,
    jamSelesai: null,
    status: 'Menunggu',
    operator: 'Kasir 1',
    counter: 'Loket 1',
    callCount: 0,
    totalAmount: 15000,
  },
  {
    id: 'q-028',
    number: 'A028',
    name: 'Deni',
    classRoom: 'Kelas 1C',
    date: todayStr,
    createdAt: now - 1000 * 60 * 4,
    jamMasuk: '07:46',
    calledAt: null,
    jamDipanggil: null,
    completedAt: null,
    jamSelesai: null,
    status: 'Menunggu',
    operator: 'Kasir 1',
    counter: 'Loket 1',
    callCount: 0,
    totalAmount: 5000,
  },
];

// Determine writable data path (supports Vercel Serverless /tmp or local data/)
function getDataFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'queues.json');
  }
  const localDataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(localDataDir)) {
    try {
      fs.mkdirSync(localDataDir, { recursive: true });
    } catch {
      return path.join('/tmp', 'queues.json');
    }
  }
  return path.join(localDataDir, 'queues.json');
}

// In-memory cache for fast access and fallback
let inMemoryQueues: QueueItem[] = [...INITIAL_DATA];
let isInitialized = false;

// Map Postgres order status to frontend QueueStatus
function mapDbStatusToFrontend(dbStatus: string): QueueItem['status'] {
  const s = String(dbStatus || '').toLowerCase();
  if (s === 'menunggu') return 'Menunggu';
  if (s === 'dipanggil') return 'Dipanggil';
  if (s === 'diproses') return 'Diproses';
  if (s === 'siap') return 'Siap';
  if (s === 'selesai') return 'Selesai';
  if (s === 'dilewati') return 'Dilewati';
  if (s === 'dibatalkan' || s === 'batal') return 'Dibatalkan';
  return 'Menunggu';
}

function mapFrontendStatusToDb(frontendStatus: QueueItem['status']): string {
  const s = String(frontendStatus || '').toLowerCase();
  if (s === 'menunggu') return 'menunggu';
  if (s === 'dipanggil') return 'dipanggil';
  if (s === 'diproses') return 'diproses';
  if (s === 'siap') return 'siap';
  if (s === 'selesai') return 'selesai';
  if (s === 'dilewati') return 'dilewati';
  if (s === 'dibatalkan') return 'dibatalkan';
  return 'menunggu';
}

// 1. Load from Supabase PostgreSQL
async function loadFromSupabase(): Promise<QueueItem[] | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase read warning:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((row) => {
        const createdMs = row.created_at ? new Date(row.created_at).getTime() : Date.now();
        const calledMs = row.called_at ? new Date(row.called_at).getTime() : null;
        const readyMs = row.ready_at ? new Date(row.ready_at).getTime() : null;
        const completedMs = row.completed_at ? new Date(row.completed_at).getTime() : null;

        return {
          id: row.id,
          clientId: row.client_id || undefined,
          number: row.queue_number,
          name: row.student_name,
          classRoom: row.class_room || 'Santri Mandiri',
          date: row.queue_date || getTodayDateString(),
          createdAt: createdMs,
          jamMasuk: getTimeString(createdMs),
          calledAt: calledMs,
          jamDipanggil: calledMs ? getTimeString(calledMs) : null,
          readyAt: readyMs,
          jamSiap: readyMs ? getTimeString(readyMs) : null,
          completedAt: completedMs,
          jamSelesai: completedMs ? getTimeString(completedMs) : null,
          status: mapDbStatusToFrontend(row.status),
          operator: row.cashier_name || 'Kasir 1',
          counter: row.counter_name || 'Loket 1',
          callCount: row.call_count || 0,
          waitingDurationMinutes: row.waiting_duration_minutes || 0,
          serviceDurationMinutes: row.service_duration_minutes || 0,
          totalAmount: Number(row.total_amount) || 0,
          notes: row.notes || undefined,
        };
      });
    } else {
      // First time initialization: seed initial sample queue into Supabase
      try {
        await seedInitialDataToSupabase();
      } catch (e) {
        console.warn('Could not seed initial data to Supabase:', e);
      }
      return [...INITIAL_DATA];
    }
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
    return null;
  }
}

// Helper to seed initial sample records into Supabase orders
async function seedInitialDataToSupabase() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const rows = INITIAL_DATA.map((item) => ({
    client_id: item.id,
    queue_number: item.number,
    student_name: item.name,
    class_room: item.classRoom || 'Santri Mandiri',
    status: mapFrontendStatusToDb(item.status),
    total_amount: item.totalAmount || 0,
    cashier_name: item.operator || 'Kasir 1',
    counter_name: item.counter || 'Loket 1',
    call_count: item.callCount || 0,
    queue_date: item.date || getTodayDateString(),
    created_at: new Date(item.createdAt).toISOString(),
    called_at: item.calledAt ? new Date(item.calledAt).toISOString() : null,
    completed_at: item.completedAt ? new Date(item.completedAt).toISOString() : null,
    waiting_duration_minutes: item.waitingDurationMinutes || 0,
    service_duration_minutes: item.serviceDurationMinutes || 0,
  }));

  await supabase.from('orders').upsert(rows, { onConflict: 'client_id' });
}

// 2. Save an updated or newly created item into Supabase PostgreSQL
export async function saveItemToSupabase(item: QueueItem): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;

  try {
    const payload = {
      client_id: item.id,
      queue_number: item.number,
      student_name: item.name,
      class_room: item.classRoom || 'Santri Mandiri',
      status: mapFrontendStatusToDb(item.status),
      total_amount: item.totalAmount || 0,
      cashier_name: item.operator || 'Kasir 1',
      counter_name: item.counter || 'Loket 1',
      call_count: item.callCount || 0,
      queue_date: item.date || getTodayDateString(),
      created_at: new Date(item.createdAt).toISOString(),
      called_at: item.calledAt ? new Date(item.calledAt).toISOString() : null,
      ready_at: item.readyAt ? new Date(item.readyAt).toISOString() : null,
      completed_at: item.completedAt ? new Date(item.completedAt).toISOString() : null,
      waiting_duration_minutes: item.waitingDurationMinutes || 0,
      service_duration_minutes: item.serviceDurationMinutes || 0,
      notes: item.notes || null,
    };

    // Upsert by client_id to prevent duplicate rows
    const { error } = await supabase
      .from('orders')
      .upsert(payload, { onConflict: 'client_id' });

    if (error) {
      console.warn('Supabase upsert warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase write exception:', err);
    return false;
  }
}

// Delete item from Supabase
export async function deleteItemFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .or(`id.eq.${id},client_id.eq.${id}`);

    if (error) {
      console.warn('Supabase delete warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase delete exception:', err);
    return false;
  }
}

// Reset today's orders in Supabase
export async function resetTodayInSupabase(): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;

  try {
    const today = getTodayDateString();
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('queue_date', today);

    if (error) {
      console.warn('Supabase reset warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase reset exception:', err);
    return false;
  }
}

// Load from Local File / /tmp
function loadFromFile(): QueueItem[] {
  try {
    const filePath = getDataFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: QueueItem) => ({
          ...item,
          status: (item.status as string) === 'Batal' ? 'Dibatalkan' : item.status,
          date: item.date || getTodayDateString(),
          jamMasuk: item.jamMasuk || getTimeString(item.createdAt),
          callCount: item.callCount || 0,
        }));
      }
    }
  } catch (err) {
    console.warn('File read warning:', err);
  }
  return [...INITIAL_DATA];
}

// Save to Local File / /tmp
function saveToFile(items: QueueItem[]): void {
  try {
    const filePath = getDataFilePath();
    const tempFile = `${filePath}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(items, null, 2), 'utf-8');
    fs.renameSync(tempFile, filePath);
  } catch (err) {
    console.warn('File write warning:', err);
  }
}

// Database Service Interface
export const db = {
  async getQueues(): Promise<QueueItem[]> {
    // 1. Try Supabase PostgreSQL if configured
    const cloudItems = await loadFromSupabase();
    if (cloudItems) {
      inMemoryQueues = cloudItems;
      isInitialized = true;
      return inMemoryQueues;
    }

    // 2. Otherwise load from local file / memory
    if (!isInitialized) {
      inMemoryQueues = loadFromFile();
      isInitialized = true;
    }
    return inMemoryQueues;
  },

  async saveQueues(items: QueueItem[]): Promise<void> {
    inMemoryQueues = items;
    // Persist to local disk / /tmp fallback
    saveToFile(items);
  },

  async upsertQueue(item: QueueItem): Promise<void> {
    // 1. Save to Supabase PostgreSQL synchronously
    if (isServerSupabaseConfigured()) {
      await saveItemToSupabase(item);
    }
    // 2. Update in-memory & local file
    const idx = inMemoryQueues.findIndex((q) => q.id === item.id || (item.clientId && q.id === item.clientId));
    if (idx >= 0) {
      inMemoryQueues[idx] = item;
    } else {
      inMemoryQueues.push(item);
    }
    saveToFile(inMemoryQueues);
  },

  async deleteQueue(id: string): Promise<void> {
    if (isServerSupabaseConfigured()) {
      await deleteItemFromSupabase(id);
    }
    inMemoryQueues = inMemoryQueues.filter((q) => q.id !== id && q.clientId !== id);
    saveToFile(inMemoryQueues);
  },

  async resetQueues(): Promise<void> {
    if (isServerSupabaseConfigured()) {
      await resetTodayInSupabase();
    }
    inMemoryQueues = [];
    saveToFile(inMemoryQueues);
  },

  getStats(items: QueueItem[]): QueueStats {
    return {
      total: items.length,
      waiting: items.filter((q) => q.status === 'Menunggu').length,
      processing: items.filter((q) => q.status === 'Diproses').length,
      ready: items.filter((q) => q.status === 'Siap').length,
      called: items.filter((q) => q.status === 'Dipanggil').length,
      completed: items.filter((q) => q.status === 'Selesai').length,
      skipped: items.filter((q) => q.status === 'Dilewati').length,
      cancelled: items.filter((q) => q.status === 'Dibatalkan').length,
    };
  },

  isCloudDatabaseConfigured(): boolean {
    return isServerSupabaseConfigured();
  },

  getDatabaseType(): 'supabase' | 'local' {
    return isServerSupabaseConfigured() ? 'supabase' : 'local';
  },
};
