import fs from 'fs';
import path from 'path';
import { QueueItem, QueueStats } from '../types';

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
  },
  {
    id: 'q-021',
    number: 'A021',
    name: 'Hasan',
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
  },
  {
    id: 'q-022',
    number: 'A022',
    name: 'Umar',
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
  },
  {
    id: 'q-023',
    number: 'A023',
    name: 'Zaki',
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
  },
  {
    id: 'q-025',
    number: 'A025',
    name: 'Ahmad',
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
  },
  {
    id: 'q-026',
    number: 'A026',
    name: 'Budi',
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
  },
  {
    id: 'q-027',
    number: 'A027',
    name: 'Rian',
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
  },
  {
    id: 'q-028',
    number: 'A028',
    name: 'Deni',
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

// In-memory cache for fast access
let inMemoryQueues: QueueItem[] = [...INITIAL_DATA];
let isInitialized = false;

// Upstash / Vercel KV REST helpers
function getKvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ''), token };
  }
  return null;
}

// 1. Load from Remote Cloud KV if available
async function loadFromCloudKV(): Promise<QueueItem[] | null> {
  const kv = getKvConfig();
  if (!kv) return null;

  try {
    const res = await fetch(`${kv.url}/get/antrean_kantin_queues`, {
      headers: {
        Authorization: `Bearer ${kv.token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.result) {
      const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Cloud KV read warning:', err);
  }
  return null;
}

// 2. Save to Remote Cloud KV if available
async function saveToCloudKV(items: QueueItem[]): Promise<boolean> {
  const kv = getKvConfig();
  if (!kv) return false;

  try {
    const res = await fetch(`${kv.url}/set/antrean_kantin_queues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kv.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items),
    });
    return res.ok;
  } catch (err) {
    console.warn('Cloud KV write warning:', err);
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
    // 1. Try cloud KV if configured
    const cloudItems = await loadFromCloudKV();
    if (cloudItems) {
      inMemoryQueues = cloudItems;
      isInitialized = true;
      return inMemoryQueues;
    }

    // 2. Otherwise load from file / memory
    if (!isInitialized) {
      inMemoryQueues = loadFromFile();
      isInitialized = true;
    }
    return inMemoryQueues;
  },

  async saveQueues(items: QueueItem[]): Promise<void> {
    inMemoryQueues = items;
    // 1. Persist to Cloud KV if available (asynchronous)
    saveToCloudKV(items).catch(() => {});
    // 2. Persist to local disk / /tmp
    saveToFile(items);
  },

  getStats(items: QueueItem[]): QueueStats {
    return {
      total: items.length,
      waiting: items.filter((q) => q.status === 'Menunggu').length,
      called: items.filter((q) => q.status === 'Dipanggil').length,
      completed: items.filter((q) => q.status === 'Selesai').length,
      skipped: items.filter((q) => q.status === 'Dilewati').length,
      cancelled: items.filter((q) => q.status === 'Dibatalkan').length,
    };
  },

  isCloudDatabaseConfigured(): boolean {
    return Boolean(getKvConfig() || process.env.DATABASE_URL || process.env.POSTGRES_URL);
  },
};
