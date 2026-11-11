import React, { useState, useEffect, useRef } from 'react';
import { QueueItem, AuthUser } from './types';
import { useRealtimeQueue } from './hooks/useRealtimeQueue';
import { api } from './services/api';
import { SantriMode } from './components/SantriMode';
import { KasirMode } from './components/KasirMode';
import { AdminMode } from './components/AdminMode';
import { DisplayBoard } from './components/DisplayBoard';
import { PinModal } from './components/PinModal';
import { announceQueue } from './utils/audio';

const STORAGE_KEY_AUTH = 'antrean_kantin_auth_user';
const STORAGE_KEY_ACTIVE_VIEW = 'antrean_kantin_active_view';

export default function App() {
  const {
    queues,
    stats,
    isOnline,
    lastAction,
    refreshQueues,
  } = useRealtimeQueue();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<'santri' | 'kasir' | 'admin' | 'display'>('santri');
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isCallingAudio, setIsCallingAudio] = useState<boolean>(false);

  // Check URL params or restore saved preference
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const requestedView = urlParams.get('view') || urlParams.get('mode');

      if (requestedView && ['santri', 'kasir', 'admin', 'display'].includes(requestedView)) {
        setActiveView(requestedView as 'santri' | 'kasir' | 'admin' | 'display');
        return;
      }

      const savedAuth = localStorage.getItem(STORAGE_KEY_AUTH);
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        setCurrentUser(parsed);
      }

      const savedView = localStorage.getItem(STORAGE_KEY_ACTIVE_VIEW);
      if (savedView && ['santri', 'kasir', 'admin', 'display'].includes(savedView)) {
        setActiveView(savedView as 'santri' | 'kasir' | 'admin' | 'display');
      }
    } catch (e) {
      console.warn('Failed to restore view state', e);
    }
  }, []);

  const switchView = (view: 'santri' | 'kasir' | 'admin' | 'display') => {
    setActiveView(view);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_VIEW, view);
    } catch (e) {
      console.warn(e);
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
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(kasirUser));
    } catch (e) {
      console.warn(e);
    }
    switchView('kasir');
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
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(adminUser));
    } catch (e) {
      console.warn(e);
    }
    switchView('admin');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch (e) {
      console.warn(e);
    }
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
        );
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

  // Centralized action handlers
  const handleAddQueue = async (number: string, name: string) => {
    try {
      await api.createQueue(number, name, currentUser?.name || 'Santri Mandiri');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
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
        {/* 1. HALAMAN SANTRI (Default, super bersih, tanpa menu yang mengganggu) */}
        {activeView === 'santri' && (
          <SantriMode
            onAddQueue={handleAddQueue}
            nextSuggestedNumber={calculateNextNumber()}
            onOpenOperatorPin={() => setIsPinModalOpen(true)}
            isOnline={isOnline}
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
            onAddManualQueue={handleAddQueue}
            onLogout={handleLogout}
            onSwitchToSantri={() => switchView('santri')}
            onSwitchToAdmin={() => switchView('admin')}
            onSwitchToDisplay={() => switchView('display')}
            isOnline={isOnline}
            isCallingAudio={isCallingAudio}
          />
        )}

        {/* 3. HP ADMIN */}
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
            onSwitchToDisplay={() => switchView('display')}
            isOnline={isOnline}
          />
        )}

        {/* 4. LAYAR MONITOR / TV */}
        {activeView === 'display' && (
          <DisplayBoard
            currentlyCalledItem={currentlyCalledItem}
            waitingList={queues.filter((q) => q.status === 'Menunggu')}
            stats={stats}
            isOnline={isOnline}
            onExit={() => switchView('santri')}
            isCallingAudio={isCallingAudio}
          />
        )}
      </div>

      {/* Touch-Friendly PIN Modal to unlock Mode Operator */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccessKasir={handleUnlockKasir}
        onSuccessAdmin={handleUnlockAdmin}
      />
    </div>
  );
}
