import React, { useState } from 'react';
import { Lock, X, ShieldAlert, Delete, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { AuthUser } from '../types';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessKasir: (user?: AuthUser) => void;
  onSuccessAdmin: (user?: AuthUser) => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccessKasir,
  onSuccessAdmin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleDigit = async (digit: string) => {
    if (isVerifying || pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError(false);
    setErrorMessage('');

    if (nextPin.length === 4) {
      setIsVerifying(true);
      try {
        const res = await api.verifyPin(nextPin);
        setTimeout(() => {
          setPin('');
          setIsVerifying(false);
          setError(false);
          if (res.role === 'admin') {
            onSuccessAdmin(res.user);
          } else {
            onSuccessKasir(res.user);
          }
        }, 150);
      } catch (err: unknown) {
        setTimeout(() => {
          setIsVerifying(false);
          setError(true);
          setErrorMessage((err as Error).message || 'PIN Salah! Silakan coba lagi.');
          setPin('');
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs border border-slate-100 overflow-hidden text-center p-6 select-none">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm">Akses Petugas</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-5">
          Masukkan 4 digit PIN untuk membuka <span className="font-bold text-slate-700">Mode Operator</span> di meja kasir.
        </p>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3.5 mb-4">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  error
                    ? 'bg-rose-500 scale-110 animate-bounce'
                    : isFilled
                    ? 'bg-blue-600 scale-125'
                    : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>

        {isVerifying ? (
          <div className="flex items-center justify-center gap-1.5 text-blue-600 text-xs font-semibold mb-3 bg-blue-50 py-1.5 px-3 rounded-lg">
            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
            <span>Memverifikasi PIN...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-1.5 text-rose-600 text-xs font-semibold mb-3 bg-rose-50 py-1.5 px-3 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage || 'PIN Salah! Silakan coba lagi.'}</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 mb-3 h-5 flex items-center justify-center">
            Masukkan 4 digit PIN petugas
          </div>
        )}

        {/* Touch Keypad */}
        <div className="grid grid-cols-3 gap-2 max-w-[230px] mx-auto mb-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-12 bg-slate-50 hover:bg-blue-50 active:bg-blue-100 text-slate-800 hover:text-blue-700 font-bold text-lg rounded-2xl border border-slate-200 active:scale-95 transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-2xl border border-slate-200 active:scale-95 transition-all flex items-center justify-center"
          >
            HAPUS
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-12 bg-slate-50 hover:bg-blue-50 active:bg-blue-100 text-slate-800 hover:text-blue-700 font-bold text-lg rounded-2xl border border-slate-200 active:scale-95 transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-2xl border border-slate-200 active:scale-95 transition-all flex items-center justify-center"
            aria-label="Backspace"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-2 text-xs text-slate-500 hover:text-slate-700 font-semibold py-1"
        >
          Kembali ke Layar Santri
        </button>
      </div>
    </div>
  );
};
