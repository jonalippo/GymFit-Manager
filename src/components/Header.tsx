import React from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { LogOut, Users, Layers, Database } from 'lucide-react';

interface HeaderProps {
  activeView: 'alumnos' | 'grupos' | 'rutina' | 'evaluacion';
  onNavigate: (view: 'alumnos' | 'grupos') => void;
  userName?: string;
  onLogout?: () => void;
  onOpenSupabaseModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  userName = 'Jonatan Lippo',
  onLogout,
  onOpenSupabaseModal,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D16]/95 backdrop-blur-md border-b border-slate-800/80 px-2.5 sm:px-6 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4 min-w-0">
        {/* Zone 1: Brand Logo & Wordmark (Zero overflow, perfectly responsive) */}
        <button
          onClick={() => onNavigate('alumnos')}
          className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none shrink min-w-0"
          title="GymFitPro Manager - Volver a listado general de Alumnos"
        >
          {/* Biomechanical Icon */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-[1.5px] shadow-lg shadow-emerald-950/60 transition-transform group-hover:scale-105 shrink-0">
            <div className="w-full h-full bg-[#0b101b] rounded-[10px] flex items-center justify-center p-1">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-emerald-400" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" className="text-emerald-400" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center">
              <span className="font-display text-sm sm:text-base font-black tracking-tight text-white leading-none whitespace-nowrap truncate">
                GymFit <span className="text-emerald-400 font-extrabold ml-0.5">Manager</span>
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase leading-tight mt-0.5 hidden sm:inline">
              Gestión de Sala & Rutinas
            </span>
          </div>
        </button>

        {/* Zone 2: General Navigation Links (STRICTLY Alumnos and Grupos, never tied to a student) */}
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold shrink-0">
          <button
            onClick={() => onNavigate('alumnos')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeView === 'alumnos' || activeView === 'rutina' || activeView === 'evaluacion'
                ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Listado general de alumnos"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Alumnos</span>
          </button>

          <button
            onClick={() => onNavigate('grupos')}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeView === 'grupos'
                ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Administración de grupos"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Grupos</span>
          </button>
        </nav>

        {/* Zone 3: User Info, PWA & Prominent Logout (Never pushes elements off-screen) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Guía de Conexión y Script SQL para Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-mono">Supabase SQL</span>
            </button>
          )}

          <PWAInstallButton />

          {/* User profile avatar & name with guaranteed max-width truncation */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 pl-2 border-l border-slate-800">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
              {userName.charAt(0)}
            </div>
            <span className="font-semibold truncate max-w-[80px] xl:max-w-[110px]" title={userName}>
              {userName.split(' ')[0]}
            </span>
          </div>

          {/* Prominent, clean Logout button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2 sm:px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-100 hover:text-white text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all shadow-sm active:scale-95 shrink-0 whitespace-nowrap"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">Cerrar Sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
