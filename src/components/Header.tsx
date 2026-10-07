import React, { useState } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { GymFitLogo } from './GymFitLogo';
import {
  Home,
  LogOut,
  Users,
  Layers,
  DollarSign,
  Menu,
  X,
  User,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  activeView: 'home' | 'alumnos' | 'grupos' | 'pagos' | 'rutina' | 'evaluacion';
  onNavigate: (view: 'home' | 'alumnos' | 'grupos' | 'pagos') => void;
  userName?: string;
  onLogout?: () => void;
  onOpenSupabaseModal?: () => void;
  isCloudConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  userName = 'Jonatan Lippo',
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: 'home' | 'alumnos' | 'grupos' | 'pagos') => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D16]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 min-w-0">
        {/* ================================================================= */}
        {/* LOGO: Al hacer clic redirige a la pantalla Home */}
        {/* ================================================================= */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center text-left group focus:outline-none shrink-0 mr-3 lg:mr-6"
          title="GymFit Manager - Ir a Inicio"
        >
          <GymFitLogo size="md" showText={true} />
        </button>

        {/* ================================================================= */}
        {/* DESKTOP NAVIGATION LINKS: Inicio, Alumnos, Grupos, Pagos */}
        {/* ================================================================= */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 text-xs sm:text-sm font-semibold shrink-0">
          <button
            onClick={() => handleNavClick('home')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeView === 'home'
                ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Panel de Control General"
          >
            <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Inicio</span>
          </button>

          <button
            onClick={() => handleNavClick('alumnos')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
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
            onClick={() => handleNavClick('grupos')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeView === 'grupos'
                ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Administración de grupos"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Grupos</span>
          </button>

          <button
            onClick={() => handleNavClick('pagos')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeView === 'pagos'
                ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Gestión de pagos y finanzas"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Pagos</span>
          </button>
        </nav>

        {/* ================================================================= */}
        {/* DESKTOP ACTIONS: PWA, User Info & Logout (Sin botón de Cloud) */}
        {/* ================================================================= */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <PWAInstallButton />

          {/* User profile avatar & name */}
          <div className="flex items-center gap-2 text-xs text-slate-300 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs shrink-0">
              {userName.charAt(0)}
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="font-bold text-white text-xs truncate max-w-[100px]" title={userName}>
                {userName.split(' ')[0]}
              </span>
              <span className="text-[9px] text-emerald-400 font-mono">Profesor</span>
            </div>
          </div>

          {/* Logout button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-100 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-xs">Cerrar Sesión</span>
            </button>
          )}
        </div>

        {/* ================================================================= */}
        {/* MOBILE HAMBURGER BUTTON (md:hidden) */}
        {/* ================================================================= */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition active:scale-95 shadow-sm"
            aria-label="Abrir menú de navegación"
            title="Menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MOBILE HAMBURGER MENU DRAWER */}
      {/* ================================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800 animate-in slide-in-from-top-2 duration-200">
          {/* User profile card inside drawer */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 mb-3 shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                {userName.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">{userName}</p>
                <p className="text-[10px] text-emerald-400 font-mono">Profesor Titular</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Sesión Activa
            </span>
          </div>

          {/* Navigation Links inside mobile menu: Inicio, Alumnos, Grupos, Pagos */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            <button
              onClick={() => handleNavClick('home')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                activeView === 'home'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => handleNavClick('alumnos')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                activeView === 'alumnos' || activeView === 'rutina' || activeView === 'evaluacion'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Alumnos</span>
            </button>

            <button
              onClick={() => handleNavClick('grupos')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                activeView === 'grupos'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Grupos</span>
            </button>

            <button
              onClick={() => handleNavClick('pagos')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                activeView === 'pagos'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Pagos</span>
            </button>
          </div>

          {/* Logout in mobile drawer */}
          {onLogout && (
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-100 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm active:scale-95"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};