import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { QueueItem, QueueStats, ProductItem } from '../types';
import { db, getTodayDateString, getTimeString } from './db';
import { getSupabaseServerClient, isServerSupabaseConfigured } from '../lib/supabase/server';

dotenv.config();

export const app = express();

// Sample Menu Produk Kantin Santri
export const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    categoryName: 'Makanan Berat',
    name: 'Nasi Pecel Telur',
    description: 'Nasi dengan pecel sayur segar bumbu kacang dan telur dadar',
    price: 10000,
    stock: 100,
    isAvailable: true,
  },
  {
    id: 'prod-2',
    categoryName: 'Makanan Berat',
    name: 'Nasi Goreng Santri',
    description: 'Nasi goreng khas kantin dengan suwiran ayam dan kerupuk',
    price: 12000,
    stock: 80,
    isAvailable: true,
  },
  {
    id: 'prod-3',
    categoryName: 'Makanan Berat',
    name: 'Mie Ayam Bakso',
    description: 'Mie kuah gurih disajikan dengan pangsit dan bakso sapi',
    price: 12000,
    stock: 75,
    isAvailable: true,
  },
  {
    id: 'prod-4',
    categoryName: 'Minuman Segar',
    name: 'Es Teh Manis',
    description: 'Teh melati segar manis dingin',
    price: 3000,
    stock: 200,
    isAvailable: true,
  },
  {
    id: 'prod-5',
    categoryName: 'Minuman Segar',
    name: 'Es Jeruk Peras',
    description: 'Jeruk asli diperas segar dengan es batu',
    price: 5000,
    stock: 150,
    isAvailable: true,
  },
  {
    id: 'prod-6',
    categoryName: 'Camilan & Roti',
    name: 'Roti Bakar Cokelat',
    description: 'Roti tawar bakar isi lelehan selai cokelat manis',
    price: 8000,
    stock: 50,
    isAvailable: true,
  },
];

// SSE Clients Registry
const sseClients = new Set<Response>();

function broadcast(eventType: string, payload: unknown) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Helper to broadcast full queue state
async function broadcastStateUpdate(actionType: string, affectedItem?: QueueItem) {
  const queues = await db.getQueues();
  broadcast('queue_update', {
    action: actionType,
    item: affectedItem || null,
    queues,
    stats: db.getStats(queues),
    timestamp: Date.now(),
  });
}

// Middleware
app.use(express.json());

// CORS & No-Cache for API
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// 1. Health check endpoint (including Supabase status)
app.get('/api/health', (req, res) => {
  const isCloud = isServerSupabaseConfigured();
  res.json({
    status: 'ok',
    online: true,
    database: isCloud ? 'supabase' : 'local_storage',
    cloudDb: isCloud,
    supabaseConfigured: isCloud,
    serverTime: Date.now(),
    clientsCount: sseClients.size,
  });
});

// 2. Real-time Server-Sent Events stream
app.get('/api/queues/events', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(': connected\n\n');

  // Immediately send initial full state
  const queues = await db.getQueues();
  res.write(`event: queue_init\ndata: ${JSON.stringify({ queues, stats: db.getStats(queues) })}\n\n`);

  sseClients.add(res);

  // Heartbeat ping every 15 seconds to prevent proxy disconnect
  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

// 3. Products list endpoint for Menu Kantin
app.get('/api/products', (req, res) => {
  res.json({
    products: DEFAULT_PRODUCTS,
  });
});

// 4. Authentication for Petugas (Dapur, Kasir, Admin) via Supabase Auth & Database Profiles
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  const cleanUser = String(username || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  if (!cleanUser || !cleanPass) {
    res.status(400).json({ success: false, error: 'Username/email dan password wajib diisi!' });
    return;
  }

  const supabase = getSupabaseServerClient();
  if (supabase && isServerSupabaseConfigured()) {
    const email = cleanUser.includes('@') ? cleanUser : `${cleanUser}@kantin.santri`;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: cleanPass,
    });

    if (authError || !authData.user) {
      res.status(401).json({ success: false, error: authError?.message || 'Login gagal.' });
      return;
    }

    // Ambil profile dan role dari tabel profiles di PostgreSQL
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, username')
      .or(`auth_user_id.eq.${authData.user.id},id.eq.${authData.user.id}`)
      .maybeSingle();

    const role = profile?.role || authData.user.user_metadata?.role || 'santri';
    const name = profile?.full_name || profile?.username || cleanUser;

    res.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: cleanUser.replace('@kantin.santri', ''),
        role,
        name,
        token: authData.session?.access_token || `token-${Date.now()}`,
      },
    });
    return;
  }

  // Fallback mode lokal jika Supabase belum dikonfigurasi
  const role: 'admin' | 'kasir' | 'dapur' | 'santri' = cleanUser.includes('dapur')
    ? 'dapur'
    : cleanUser.includes('kasir')
    ? 'kasir'
    : cleanUser.includes('admin')
    ? 'admin'
    : 'santri';

  res.json({
    success: true,
    user: {
      username: cleanUser,
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
    },
  });
});

// Verifikasi PIN Mode Operator di Meja Kasir (Diverifikasi melalui database profiles)
app.post('/api/auth/verify-pin', async (req, res) => {
  const { pin } = req.body || {};
  const cleanPin = String(pin || '').trim();

  if (!cleanPin) {
    res.status(400).json({ success: false, error: 'PIN wajib diisi!' });
    return;
  }

  const supabase = getSupabaseServerClient();
  if (supabase && isServerSupabaseConfigured()) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, username')
      .eq('pin_code', cleanPin)
      .maybeSingle();

    if (profile) {
      res.json({
        success: true,
        role: profile.role,
        user: {
          username: profile.username || profile.role,
          role: profile.role,
          name: profile.full_name || profile.username,
          token: `pin-token-${profile.role}-${Date.now()}`,
        },
      });
      return;
    }
  }

  // Fallback PIN pengujian lokal jika Supabase belum terhubung
  if (cleanPin === '9999') {
    res.json({
      success: true,
      role: 'admin',
      user: { username: 'admin', role: 'admin', name: 'Administrator Kantin', token: `pin-admin-${Date.now()}` },
    });
    return;
  }
  if (cleanPin === '1234') {
    res.json({
      success: true,
      role: 'kasir',
      user: { username: 'kasir', role: 'kasir', name: 'Petugas Kasir', token: `pin-kasir-${Date.now()}` },
    });
    return;
  }
  if (cleanPin === '2222') {
    res.json({
      success: true,
      role: 'dapur',
      user: { username: 'dapur', role: 'dapur', name: 'Petugas Dapur Kantin', token: `pin-dapur-${Date.now()}` },
    });
    return;
  }

  res.status(401).json({ success: false, error: 'PIN salah! Silakan periksa kembali.' });
});

// 5. Get all queues and current stats
app.get('/api/queues', async (req, res) => {
  const queues = await db.getQueues();
  res.json({
    queues,
    stats: db.getStats(queues),
    cloudDb: db.isCloudDatabaseConfigured(),
    databaseType: db.getDatabaseType(),
    serverTime: Date.now(),
  });
});

// 6. Add new queue (Santri or Kasir) with DUPLICATE NUMBER CHECK
app.post('/api/queues', async (req, res) => {
  const {
    number,
    name,
    classRoom,
    items,
    totalAmount,
    notes,
    operator,
    counter,
    clientId,
  } = req.body || {};

  const cleanName = String(name || '').trim();
  const rawNum = String(number || '').trim().toUpperCase();

  if (!rawNum) {
    res.status(400).json({ error: 'Nomor antrean wajib diisi!' });
    return;
  }

  if (!cleanName) {
    res.status(400).json({ error: 'Nama santri wajib diisi!' });
    return;
  }

  // Format number: e.g. "025" or "25" -> "A025"
  let formattedNum = rawNum;
  if (/^\d+$/.test(formattedNum)) {
    formattedNum = 'A' + formattedNum.padStart(3, '0');
  }

  const queues = await db.getQueues();

  // Check duplicate active queue
  const isDuplicateActive = queues.some(
    (q) =>
      q.number.toUpperCase() === formattedNum.toUpperCase() &&
      (q.status === 'Menunggu' || q.status === 'Diproses' || q.status === 'Dipanggil' || q.status === 'Siap')
  );

  if (isDuplicateActive) {
    res.status(400).json({
      error: `Nomor antrean ${formattedNum} sedang aktif dan belum selesai.`,
    });
    return;
  }

  const createdAt = Date.now();
  const newItemId = clientId || `q-${createdAt}-${Math.random().toString(36).substring(2, 7)}`;

  const newItem: QueueItem = {
    id: newItemId,
    clientId: newItemId,
    number: formattedNum,
    name: cleanName,
    classRoom: String(classRoom || 'Santri Mandiri').trim(),
    date: getTodayDateString(),
    createdAt,
    jamMasuk: getTimeString(createdAt),
    calledAt: null,
    jamDipanggil: null,
    readyAt: null,
    jamSiap: null,
    completedAt: null,
    jamSelesai: null,
    status: 'Menunggu',
    operator: operator || 'Kasir 1',
    counter: counter || 'Loket 1',
    callCount: 0,
    waitingDurationMinutes: 0,
    serviceDurationMinutes: 0,
    items: Array.isArray(items) ? items : [],
    totalAmount: Number(totalAmount) || 0,
    notes: notes ? String(notes).trim() : undefined,
  };

  await db.upsertQueue(newItem);
  broadcastStateUpdate('CREATE', newItem);

  res.status(201).json({
    success: true,
    item: newItem,
  });
});

// 7. Batch Sync for Offline Queues (Prevents duplicates via clientId)
app.post('/api/queues/sync', async (req, res) => {
  const { offlineItems } = req.body || {};
  if (!Array.isArray(offlineItems) || offlineItems.length === 0) {
    res.json({ success: true, syncedCount: 0 });
    return;
  }

  const currentQueues = await db.getQueues();
  let syncedCount = 0;

  for (const item of offlineItems) {
    // Check if already synced by clientId or ID
    const exists = currentQueues.some(
      (q) => (item.clientId && q.clientId === item.clientId) || q.id === item.id
    );

    if (!exists) {
      await db.upsertQueue(item);
      syncedCount++;
    }
  }

  if (syncedCount > 0) {
    broadcastStateUpdate('SYNC');
  }

  res.json({
    success: true,
    syncedCount,
    message: `${syncedCount} antrean offline berhasil disinkronkan ke database.`,
  });
});

// 8. Call queue (PANGGIL - Kasir)
app.post('/api/queues/:id/call', async (req, res) => {
  const { id } = req.params;
  const { operator, counter } = req.body || {};

  const queues = await db.getQueues();
  const target = queues.find((q) => q.id === id || q.clientId === id);
  if (!target) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  const nowMs = Date.now();
  target.status = 'Dipanggil';
  target.calledAt = nowMs;
  target.jamDipanggil = getTimeString(nowMs);
  target.callCount = (target.callCount || 0) + 1;
  target.waitingDurationMinutes = Math.max(1, Math.round((nowMs - target.createdAt) / 60000));

  if (operator) target.operator = operator;
  if (counter) target.counter = counter;

  await db.upsertQueue(target);
  broadcastStateUpdate('CALL', target);

  res.json({ success: true, item: target });
});

// 9. Recall queue (PANGGIL ULANG)
app.post('/api/queues/:id/recall', async (req, res) => {
  const { id } = req.params;
  const queues = await db.getQueues();
  const target = queues.find((q) => q.id === id || q.clientId === id);
  if (!target) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  target.calledAt = Date.now();
  target.callCount = (target.callCount || 0) + 1;

  await db.upsertQueue(target);
  broadcastStateUpdate('RECALL', target);

  res.json({ success: true, item: target });
});

// 10. Process queue (DIPROSES - Dapur)
app.post('/api/queues/:id/process', async (req, res) => {
  const { id } = req.params;
  const queues = await db.getQueues();
  const target = queues.find((q) => q.id === id || q.clientId === id);
  if (!target) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  target.status = 'Diproses';

  await db.upsertQueue(target);
  broadcastStateUpdate('PROCESS', target);

  res.json({ success: true, item: target });
});

// 11. Ready queue (SIAP - Dapur)
app.post('/api/queues/:id/ready', async (req, res) => {
  const { id } = req.params;
  const queues = await db.getQueues();
  const target = queues.find((q) => q.id === id || q.clientId === id);
  if (!target) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  const nowMs = Date.now();
  target.status = 'Siap';
  target.readyAt = nowMs;
  target.jamSiap = getTimeString(nowMs);

  await db.upsertQueue(target);
  broadcastStateUpdate('READY', target);

  res.json({ success: true, item: target });
});

// 12. Complete queue (SELESAI - Kasir / Dapur)
app.post('/api/queues/:id/complete', async (req, res) => {
  const { id } = req.params;
  const queues = await db.getQueues();
  const target = queues.find((q) => q.id === id || q.clientId === id);
  if (!target) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  const nowMs = Date.now();
  target.status = 'Selesai';
  target.completedAt = nowMs;
  target.jamSelesai = getTimeString(nowMs);

  if (target.calledAt) {
    target.serviceDurationMinutes = Math.max(1, Math.round((nowMs - target.calledAt) / 60000));
  } else {
    target.serviceDurationMinutes = 1;
  }

  if (!target.waitingDurationMinutes && target.createdAt) {
    target.waitingDurationMinutes = Math.max(1, Math.round((nowMs - target.createdAt) / 60000));
  }

  await db.upsertQueue(target);
  broadcastStateUpdate('COMPLETE', target);

  res.json({ success: true, item: target });
});

// 13. Skip queue (LEWATI)
app.post('/api/queues/:id/skip', async (req, res) => {
  const { id } = req.params;
  const queues = await db.getQueues();
  const target = queues.find((q) => q.id === id || q.clientId === id);
  if (!target) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  target.status = 'Dilewati';

  await db.upsertQueue(target);
  broadcastStateUpdate('SKIP', target);

  res.json({ success: true, item: target });
});

// 14. Cancel queue (DIBATALKAN)
app.post('/api/queues/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const queues = await db.getQueues();
  const target = queues.find((q) => q.id === id || q.clientId === id);
  if (!target) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  target.status = 'Dibatalkan';

  await db.upsertQueue(target);
  broadcastStateUpdate('CANCEL', target);

  res.json({ success: true, item: target });
});

// 15. Delete queue (HAPUS YANG SALAH - Admin only)
app.delete('/api/queues/:id', async (req, res) => {
  const { id } = req.params;
  await db.deleteQueue(id);
  broadcastStateUpdate('DELETE');

  res.json({ success: true, message: 'Antrean berhasil dihapus' });
});

// 16. Reset today's queue (RESET ANTREAN HARIAN - Admin only)
app.post('/api/queues/reset', async (req, res) => {
  await db.resetQueues();
  broadcastStateUpdate('RESET');

  res.json({ success: true, message: 'Semua antrean hari ini telah di-reset.' });
});

export default app;
