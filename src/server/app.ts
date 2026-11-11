import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { QueueItem, QueueStats } from '../types';
import { db, getTodayDateString, getTimeString } from './db';

dotenv.config();

export const app = express();

// Kredensial Keamanan Server-Side (Environment Variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_PIN = process.env.ADMIN_PIN || '9999';

const KASIR_USERNAME = process.env.KASIR_USERNAME || 'kasir';
const KASIR_PASSWORD = process.env.KASIR_PASSWORD || 'kasir123';
const KASIR_PIN = process.env.KASIR_PIN || '1234';

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

// 1. Health check endpoint (including cloud DB status)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    online: true,
    cloudDb: db.isCloudDatabaseConfigured(),
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

// 3. Authentication for Petugas (Kasir & Admin) via Environment Variables
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const cleanUser = String(username || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();

  // Admin login check
  if (
    cleanUser === ADMIN_USERNAME.toLowerCase() &&
    (cleanPass === ADMIN_PASSWORD || cleanPass === ADMIN_PIN)
  ) {
    res.json({
      success: true,
      user: {
        username: ADMIN_USERNAME,
        role: 'admin',
        name: 'Administrator Kantin',
        token: 'auth-token-admin-' + Date.now(),
      },
    });
    return;
  }

  // Kasir login check
  if (
    cleanUser === KASIR_USERNAME.toLowerCase() &&
    (cleanPass === KASIR_PASSWORD || cleanPass === KASIR_PIN)
  ) {
    res.json({
      success: true,
      user: {
        username: KASIR_USERNAME,
        role: 'kasir',
        name: 'Petugas Kasir',
        token: 'auth-token-kasir-' + Date.now(),
      },
    });
    return;
  }

  res.status(401).json({
    success: false,
    error: 'Username, password, atau PIN tidak valid!',
  });
});

// Verifikasi PIN Mode Operator & Admin di Meja Kasir (Server-side check)
app.post('/api/auth/verify-pin', (req, res) => {
  const { pin } = req.body || {};
  const cleanPin = String(pin || '').trim();

  if (!cleanPin) {
    res.status(400).json({ success: false, error: 'PIN wajib diisi!' });
    return;
  }

  if (cleanPin === ADMIN_PIN) {
    res.json({
      success: true,
      role: 'admin',
      user: {
        username: ADMIN_USERNAME,
        role: 'admin',
        name: 'Administrator Kantin',
        token: 'pin-token-admin-' + Date.now(),
      },
    });
    return;
  }

  if (cleanPin === KASIR_PIN) {
    res.json({
      success: true,
      role: 'kasir',
      user: {
        username: KASIR_USERNAME,
        role: 'kasir',
        name: 'Petugas Kasir',
        token: 'pin-token-kasir-' + Date.now(),
      },
    });
    return;
  }

  res.status(401).json({
    success: false,
    error: 'PIN salah! Silakan periksa kembali.',
  });
});

// 4. Get all queues and current stats
app.get('/api/queues', async (req, res) => {
  const queues = await db.getQueues();
  res.json({
    queues,
    stats: db.getStats(queues),
    cloudDb: db.isCloudDatabaseConfigured(),
    serverTime: Date.now(),
  });
});

// 5. Add new queue (Santri or Kasir) with DUPLICATE NUMBER CHECK
app.post('/api/queues', async (req, res) => {
  const { number, name, operator, counter } = req.body || {};

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
      (q.status === 'Menunggu' || q.status === 'Dipanggil')
  );

  if (isDuplicateActive) {
    res.status(400).json({
      error: `Nomor antrean ${formattedNum} sudah digunakan.`,
    });
    return;
  }

  const createdAt = Date.now();
  const newItem: QueueItem = {
    id: `q-${createdAt}-${Math.random().toString(36).substring(2, 7)}`,
    number: formattedNum,
    name: cleanName,
    date: getTodayDateString(),
    createdAt,
    jamMasuk: getTimeString(createdAt),
    calledAt: null,
    jamDipanggil: null,
    completedAt: null,
    jamSelesai: null,
    status: 'Menunggu',
    operator: operator || 'Kasir 1',
    counter: counter || 'Loket 1',
    callCount: 0,
    waitingDurationMinutes: 0,
    serviceDurationMinutes: 0,
  };

  queues.push(newItem);
  await db.saveQueues(queues);
  broadcastStateUpdate('CREATE', newItem);

  res.status(201).json({
    success: true,
    item: newItem,
  });
});

// 6. Call queue (PANGGIL)
app.post('/api/queues/:id/call', async (req, res) => {
  const { id } = req.params;
  const { operator, counter } = req.body || {};

  const queues = await db.getQueues();
  const itemIndex = queues.findIndex((q) => q.id === id);
  if (itemIndex === -1) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  const target = queues[itemIndex];
  const nowMs = Date.now();
  target.status = 'Dipanggil';
  target.calledAt = nowMs;
  target.jamDipanggil = getTimeString(nowMs);
  target.callCount = (target.callCount || 0) + 1;
  target.waitingDurationMinutes = Math.max(1, Math.round((nowMs - target.createdAt) / 60000));

  if (operator) target.operator = operator;
  if (counter) target.counter = counter;

  await db.saveQueues(queues);
  broadcastStateUpdate('CALL', target);

  res.json({ success: true, item: target });
});

// 7. Recall queue (PANGGIL ULANG)
app.post('/api/queues/:id/recall', async (req, res) => {
  const { id } = req.params;
  const queues = await db.getQueues();
  const itemIndex = queues.findIndex((q) => q.id === id);
  if (itemIndex === -1) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  const target = queues[itemIndex];
  target.calledAt = Date.now();
  target.callCount = (target.callCount || 0) + 1;

  await db.saveQueues(queues);
  broadcastStateUpdate('RECALL', target);

  res.json({ success: true, item: target });
});

// 8. Complete queue (SELESAI)
app.post('/api/queues/:id/complete', async (req, res) => {
  const { id } = req.params;
  const queues = await db.getQueues();
  const itemIndex = queues.findIndex((q) => q.id === id);
  if (itemIndex === -1) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  const target = queues[itemIndex];
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

  await db.saveQueues(queues);
  broadcastStateUpdate('COMPLETE', target);

  res.json({ success: true, item: target });
});

// 9. Skip queue (LEWATI)
app.post('/api/queues/:id/skip', async (req, res) => {
  const { id } = req.params;
  const queues = await db.getQueues();
  const itemIndex = queues.findIndex((q) => q.id === id);
  if (itemIndex === -1) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  const target = queues[itemIndex];
  target.status = 'Dilewati';

  await db.saveQueues(queues);
  broadcastStateUpdate('SKIP', target);

  res.json({ success: true, item: target });
});

// 10. Cancel queue (DIBATALKAN)
app.post('/api/queues/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const queues = await db.getQueues();
  const itemIndex = queues.findIndex((q) => q.id === id);
  if (itemIndex === -1) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  const target = queues[itemIndex];
  target.status = 'Dibatalkan';

  await db.saveQueues(queues);
  broadcastStateUpdate('CANCEL', target);

  res.json({ success: true, item: target });
});

// 11. Delete queue (HAPUS YANG SALAH - Admin only)
app.delete('/api/queues/:id', async (req, res) => {
  const { id } = req.params;
  const queues = await db.getQueues();
  const itemIndex = queues.findIndex((q) => q.id === id);
  if (itemIndex === -1) {
    res.status(404).json({ error: 'Antrean tidak ditemukan' });
    return;
  }

  const removed = queues.splice(itemIndex, 1)[0];
  await db.saveQueues(queues);
  broadcastStateUpdate('DELETE', removed);

  res.json({ success: true, removed });
});

// 12. Reset today's queue (RESET ANTREAN HARIAN - Admin only)
app.post('/api/queues/reset', async (req, res) => {
  await db.saveQueues([]);
  broadcastStateUpdate('RESET');

  res.json({ success: true, message: 'Semua antrean hari ini telah di-reset.' });
});

export default app;
