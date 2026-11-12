import React, { useState } from 'react';
import { Lock, User, Key, X, AlertCircle, ShieldCheck, Hash, Delete, Loader2 } from 'lucide-react';
import { authService } from '../services/auth';
import { api } from '../services/api';
import { AuthUser } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'pin' | 'auth'>('pin');

  // PIN mode states
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

  // Supabase Auth mode states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  if (!isOpen) return null;

  // Handler for PIN Digits
  const handlePinDigit = async (digit: string) => {
    if (pinLoading || pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setPinError('');

    if (nextPin.length === 4) {
      setPinLoading(true);
      try {
        const res = await api.verifyPin(nextPin);
        setTimeout(() => {
          setPin('');
          setPinLoading(false);
          onSuccess(res.user);
          onClose();
        }, 150);
      } catch (err: unknown) {
        setTimeout(() => {
          setPinLoading(false);
          setPinError((err as Error).message || 'PIN Salah! Silakan coba lagi.');
          setPin('');
        }, 200);
      }
    }
  };

  const handlePinDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setPinError('');
  };

  const handlePinClear = () => {
    setPin('');
    setPinError('');
  };

  // Handler for Supabase Auth Form
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setAuthError('Masukkan email/username dan password!');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const user = await authService.login(identifier, password);
      onSuccess(user);
      onClose();
    } catch (err: unknown) {
      setAuthError((err as Error).message || 'Login gagal. Periksa kembali akun Anda.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickFill = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setAuthError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden p-6 select-none">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Akses Petugas Kantin</h2>
              <p className="text-xs text-slate-500">Dapur, Kasir, atau Administrator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: PIN Cepat vs Supabase Auth */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab('pin')}
            className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'pin' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>PIN Cepat</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('auth')}
            className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'auth' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Supabase Auth</span>
          </button>
        </div>

        {/* TAB 1: PIN CEPAT OPERATOR */}
        {tab === 'pin' && (
          <div className="text-center space-y-3">
            <p className="text-xs text-slate-500">
              Ketik 4 digit PIN petugas di layar kasir:
            </p>

            {/* PIN Dots */}
            <div className="flex justify-center gap-3 py-1">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                      pinError
                        ? 'bg-rose-500 scale-110'
                        : isFilled
                        ? 'bg-emerald-600 scale-125'
                        : 'bg-slate-200'
                    }`}
                  />
                );
              })}
            </div>

            {pinLoading ? (
              <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-xs font-semibold py-1 bg-emerald-50 rounded-lg">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memverifikasi PIN...</span>
              </div>
            ) : pinError ? (
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 py-1 px-2 rounded-lg">
                {pinError}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 h-5 flex items-center justify-center">
                Kasir: 1234 • Dapur: 2222 • Admin: 9999
              </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinDigit(num)}
                  className="h-11 bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 text-slate-800 hover:text-emerald-800 font-black text-lg rounded-xl border border-slate-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handlePinClear}
                className="h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center cursor-pointer"
              >
                HAPUS
              </button>
              <button
                type="button"
                onClick={() => handlePinDigit('0')}
                className="h-11 bg-slate-50 hover:bg-emerald-50 text-slate-800 font-black text-lg rounded-xl border border-slate-200 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handlePinDelete}
                className="h-11 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl border border-slate-200 transition-all flex items-center justify-center cursor-pointer"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SUPABASE AUTH */}
        {tab === 'auth' && (
          <div>
            {authError && (
              <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Email atau Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="cth: dapur, kasir, atau admin"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="******"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Quick preset selector */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Pilih akun petugas:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('dapur', 'dapur123')}
                    className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition text-center cursor-pointer"
                  >
                    🍳 Dapur
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('kasir', 'kasir123')}
                    className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg transition text-center cursor-pointer"
                  >
                    👤 Kasir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin', 'admin123')}
                    className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-lg transition text-center cursor-pointer"
                  >
                    👑 Admin
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-3 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? 'Memverifikasi Akun...' : 'MASUK DENGAN SUPABASE AUTH'}
              </button>
            </form>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Role (Dapur, Kasir, Admin) dikontrol dari database PostgreSQL Supabase tabel <span className="font-mono font-bold">profiles</span>.
          </p>
        </div>
      </div>
    </div>
  );
};
