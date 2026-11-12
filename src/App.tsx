import React, { useState, useEffect, useRef } from 'react';
import { QueueItem, AuthUser } from './types';
import { useRealtimeQueue } from './hooks/useRealtimeQueue';
import { api } from './services/api';
import { SantriMode } from './components/SantriMode';
import { KasirMode } from './components/KasirMode';
import { DapurMode } from './components/DapurMode';
import { AdminMode } from './components/AdminMode';
import { DisplayBoard } from './components/DisplayBoard';
import { PinModal } from './components/PinModal';
import { LoginModal } from './components/LoginModal';
import { authService } from './services/auth';
import { announceQueue } from './utils/audio';

const STORAGE_KEY_AUTH = 'antrean_kantin_auth_user';
const STORAGE_KEY_ACTIVE_VIEW = 'antrean_kantin_active_view';

export default function App() {
  const {
    queues,
    stats,
    isOnline,
    isCloudDb,
    supabaseConfigured,
    lastAction,
    enqueueOffline,
    refreshQueues,
  } = useRealtimeQueue();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<'santri' | 'kasir' | 'dapur' | 'admin' | 'display'>('santri');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isCallingAudio, setIsCallingAudio] = useState<boolean>(false);

  // Check URL params or restore saved preference
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const requestedView = urlParams.get('view') || urlParams.get('mode');

      if (requestedView && ['santri', 'kasir', 'dapur', 'admin', 'display'].includes(requestedView)) {
        setActiveView(requestedView as 'santri' | 'kasir' | 'dapur' | 'admin' | 'display');
        return;
      }

      const savedUser = authService.getSavedUser();
      if (savedUser) {
        setCurrentUser(savedUser);
      }

      const savedView = localStorage.getItem(STORAGE_KEY_ACTIVE_VIEW);
      if (savedView && ['santri', 'kasir', 'dapur', 'admin', 'display'].includes(savedView)) {
        setActiveView(savedView as 'santri' | 'kasir' | 'dapur' | 'admin' | 'display');
      }
    } catch (e) {
      console.warn('Failed to restore view state', e);
    }
  }, []);

  const switchView = (view: 'santri' | 'kasir' | 'dapur' | 'admin' | 'display') => {
    setActiveView(view);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_VIEW, view);
    } catch (e) {
      console.warn(e);
    }
  };

  // Login Sukses via Supabase Auth: Role otomatis dideteksi dari database profiles!
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    setIsPinModalOpen(false);

    if (user.role === 'dapur') {
      switchView('dapur');
    } else if (user.role === 'kasir') {
      switchView('kasir');
    } else if (user.role === 'admin') {
      switchView('admin');
    } else {
      switchView('santri');
    }
  };

  const handleUnlockKasir = (authenticatedUser?: AuthUser) => {
    setIsPinModalOpen(false);
    const kasirUser: AuthUser = authenticatedUser || {
      username: 'kasir',
      role: 'kasir',
      name: 'Kasir Kantin',
      token: 'kasir-token-' + Date.now(),
    };
    setCurrentUser(kasirUser);
    switchView('kasir');
  };

  const handleUnlockDapur = (authenticatedUser?: AuthUser) => {
    setIsPinModalOpen(false);
    const dapurUser: AuthUser = authenticatedUser || {
      username: 'dapur',
      role: 'dapur',
      name: 'Petugas Dapur',
      token: 'dapur-token-' + Date.now(),
    };
    setCurrentUser(dapurUser);
    switchView('dapur');
  };

  const handleUnlockAdmin = (authenticatedUser?: AuthUser) => {
    setIsPinModalOpen(false);
    const adminUser: AuthUser = authenticatedUser || {
      username: 'admin',
      role: 'admin',
      name: 'Admin Kantin',
      token: 'admin-token-' + Date.now(),
    };
    setCurrentUser(adminUser);
    switchView('admin');
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    switchView('santri');
  };

  // Find currently called item
  const currentlyCalledItem = queues.find((q) => q.status === 'Dipanggil') || null;

  // Track previous call action to trigger audio announcement
  const lastAnnouncedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastAction && (lastAction.action === 'CALL' || lastAction.action === 'RECALL') && lastAction.item) {
      const callKey = `${lastAction.item.id}-${lastAction.item.callCount}-${lastAction.action}`;
      if (lastAnnouncedIdRef.current !== callKey) {
        lastAnnouncedIdRef.current = callKey;
        announceQueue(
          lastAction.item.number,
          lastAction.item.name,
          () => setIsCallingAudio(true),
          () => setIsCallingAudio(false)
        ).catch((err) => {
          console.warn('Audio announcement caught error:', err);
          setIsCallingAudio(false);
        });
      }
    }
  }, [lastAction]);

  // Calculate next suggested queue number
  const calculateNextNumber = (): string => {
    let highest = 0;
    queues.forEach((item) => {
      const match = item.number.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val > highest) highest = val;
      }
    });

    if (highest === 0) return '001';
    return String(highest + 1).padStart(3, '0');
  };

  // Centralized action handlers with Offline & Online support
  const handleAddQueue = async (payload: {
    number: string;
    name: string;
    classRoom?: string;
    items?: any[];
    totalAmount?: number;
    notes?: string;
  }) => {
    const clientId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullItem: QueueItem = {
      id: clientId,
      clientId,
      number: payload.number,
      name: payload.name,
      classRoom: payload.classRoom || 'Santri Mandiri',
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      jamMasuk: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'Menunggu',
      operator: currentUser?.name || 'Santri Mandiri',
      counter: 'Loket 1',
      callCount: 0,
      items: payload.items || [],
      totalAmount: payload.totalAmount || 0,
      notes: payload.notes,
    };

    // If currently offline, queue locally
    if (!isOnline) {
      enqueueOffline(fullItem);
      return { success: true, offlineQueued: true };
    }

    try {
      await api.createQueue({
        ...payload,
        clientId,
        operator: currentUser?.name || 'Santri Mandiri',
      });
      return { success: true };
    } catch (err: unknown) {
      // In case network drops mid-request, save offline
      enqueueOffline(fullItem);
      return { success: true, offlineQueued: true };
    }
  };

  const handleCall = async (item: QueueItem) => {
    try {
      await api.callQueue(item.id, currentUser?.name || 'Kasir', 'Loket 1');
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleRecall = async (item: QueueItem) => {
    try {
      await api.recallQueue(item.id, currentUser?.name || 'Kasir');
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleProcess = async (item: QueueItem) => {
    try {
      await api.processQueue(item.id);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleReady = async (item: QueueItem) => {
    try {
      await api.readyQueue(item.id);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleComplete = async (item: QueueItem) => {
    try {
      await api.completeQueue(item.id, currentUser?.name || 'Kasir');
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleSkip = async (item: QueueItem) => {
    try {
      await api.skipQueue(item.id, currentUser?.name || 'Kasir');
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleCancel = async (item: QueueItem) => {
    try {
      await api.cancelQueue(item.id, currentUser?.name || 'Admin');
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteQueue(id);
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleResetToday = async () => {
    try {
      await api.resetQueues();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* View Content */}
      <div className="flex-1">
        {/* 1. HALAMAN SANTRI (Default, meja kasir) */}
        {activeView === 'santri' && (
          <SantriMode
            onAddQueue={handleAddQueue}
            nextSuggestedNumber={calculateNextNumber()}
            onOpenOperatorPin={() => setIsLoginModalOpen(true)}
            isOnline={isOnline}
            isCloudDb={isCloudDb}
            supabaseConfigured={supabaseConfigured}
            currentQueues={queues}
          />
        )}

        {/* 2. HP KASIR / OPERATOR */}
        {activeView === 'kasir' && (
          <KasirMode
            user={currentUser || { username: 'kasir', role: 'kasir', name: 'Kasir Kantin', token: '' }}
            queueList={queues}
            currentlyCalledItem={currentlyCalledItem}
            onCall={handleCall}
            onRecall={handleRecall}
            onComplete={handleComplete}
            onSkip={handleSkip}
            onAddManualQueue={async (num, name) => {
              const res = await handleAddQueue({ number: num, name });
              return res;
            }}
            onLogout={handleLogout}
            onSwitchToSantri={() => switchView('santri')}
            onSwitchToDapur={() => switchView('dapur')}
            onSwitchToAdmin={() => switchView('admin')}
            onSwitchToDisplay={() => switchView('display')}
            isOnline={isOnline}
            isCallingAudio={isCallingAudio}
          />
        )}

        {/* 3. DAPUR KANTIN */}
        {activeView === 'dapur' && (
          <DapurMode
            user={currentUser || { username: 'dapur', role: 'dapur', name: 'Petugas Dapur', token: '' }}
            queueList={queues}
            onProcess={handleProcess}
            onReady={handleReady}
            onComplete={handleComplete}
            onLogout={handleLogout}
            onSwitchToSantri={() => switchView('santri')}
            onSwitchToKasir={() => switchView('kasir')}
            onSwitchToAdmin={() => switchView('admin')}
            onSwitchToDisplay={() => switchView('display')}
            isOnline={isOnline}
          />
        )}

        {/* 4. HP ADMIN */}
        {activeView === 'admin' && (
          <AdminMode
            user={currentUser || { username: 'admin', role: 'admin', name: 'Admin Kantin', token: '' }}
            queueList={queues}
            stats={stats}
            currentlyCalledItem={currentlyCalledItem}
            onCall={handleCall}
            onRecall={handleRecall}
            onComplete={handleComplete}
            onSkip={handleSkip}
            onCancel={handleCancel}
            onDelete={handleDelete}
            onResetToday={handleResetToday}
            onRefresh={refreshQueues}
            onLogout={handleLogout}
            onSwitchToSantri={() => switchView('santri')}
            onSwitchToKasir={() => switchView('kasir')}
            onSwitchToDapur={() => switchView('dapur')}
            onSwitchToDisplay={() => switchView('display')}
            isOnline={isOnline}
            isCloudDb={isCloudDb}
            supabaseConfigured={supabaseConfigured}
          />
        )}

        {/* 5. LAYAR MONITOR / TV */}
        {activeView === 'display' && (
          <DisplayBoard
            currentlyCalledItem={currentlyCalledItem}
            waitingList={queues.filter((q) => q.status === 'Menunggu' || q.status === 'Diproses')}
            stats={stats}
            isOnline={isOnline}
            onExit={() => switchView('santri')}
            isCallingAudio={isCallingAudio}
          />
        )}
      </div>

      {/* Supabase Auth Modal untuk Petugas (Dapur, Kasir, Admin) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Touch-Friendly PIN Modal sebagai alternatif */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccessKasir={handleUnlockKasir}
        onSuccessDapur={handleUnlockDapur}
        onSuccessAdmin={handleUnlockAdmin}
      />
    </div>
  );
}
