import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetLocalState = () => {
    try {
      localStorage.removeItem('antrean_kantin_auth_user');
      localStorage.removeItem('antrean_kantin_active_view');
      localStorage.removeItem('antrean_kantin_offline_pending_v1');
    } catch (e) {
      console.warn(e);
    }
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 text-center border border-slate-200 select-none">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-black text-slate-900 mb-1">
              Terjadi Kendala pada Tampilan
            </h1>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Aplikasi mendeteksi kesalahan sementara pada browser. Anda dapat memuat ulang atau membersihkan sesi cache lokal untuk memulihkan tampilan.
            </p>

            {this.state.error && (
              <div className="text-left bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 max-h-32 overflow-y-auto">
                <p className="text-[11px] font-mono font-bold text-rose-600 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Muat Ulang Aplikasi</span>
              </button>

              <button
                onClick={this.handleResetLocalState}
                className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Sesi & Cache Lokal</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-4">
              Antrean Kantin Santri • Terpusat & Real-Time
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
