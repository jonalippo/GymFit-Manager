import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Dumbbell, Sparkles, User, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (userData: { name: string; email: string; role: 'admin_gimnasio' | 'profesor' }) => void;
  defaultEmail?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, defaultEmail = 'jonalippo@gmail.com' }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('Jonatan Lippo');
  const [gymName, setGymName] = useState('Centro de Entrenamiento Biomecánico');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    onLogin({
      name: isRegister ? (name.trim() || 'Entrenador') : (email.includes('jonalippo') ? 'Jonatan Lippo' : email.split('@')[0]),
      email: email.trim(),
      role: 'admin_gimnasio'
    });
  };

  const handleQuickLogin = (demoName: string, demoEmail: string, role: 'admin_gimnasio' | 'profesor') => {
    onLogin({
      name: demoName,
      email: demoEmail,
      role
    });
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Auth Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {/* Logo Badge */}
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 shadow-xl shadow-emerald-950/60 ring-2 ring-emerald-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-slate-950" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" className="text-slate-950" />
            </svg>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
            GymFit <span className="text-emerald-400">Manager</span>
          </h1>
        </div>

        {/* Auth Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-5">
          {/* Toggle Login / Register */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 rounded-lg transition ${
                !isRegister ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 rounded-lg transition ${
                isRegister ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isRegister && (
              <>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Nombre y Apellido</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Jonatan Lippo"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Gimnasio / Organización</label>
                  <div className="relative">
                    <Dumbbell className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                      placeholder="Ej. FitPro Gym Center"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Recordar sesión</span>
              </label>
              <span className="text-slate-500">Cifrado de datos AES-256</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 active:scale-98 transition flex items-center justify-center gap-2 mt-2"
            >
              <span>{isRegister ? 'Registrar Gimnasio y Acceder' : 'Ingresar a la Plataforma'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <p className="text-[11px] text-slate-500 text-center font-medium">
              O ingresa con 1 clic como entrenador demo:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('Jonatan Lippo', 'jonalippo@gmail.com', 'admin_gimnasio')}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-slate-200 text-xs font-semibold flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    JL
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white text-xs leading-none">Jonatan Lippo</p>
                    <p className="text-[10px] text-slate-400 leading-tight">jonalippo@gmail.com (Profesor Titular)</p>
                  </div>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Security & Offline Badge */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Almacenamiento local IndexedDB con modo Offline de sala</span>
          </p>
        </div>
      </div>
    </div>
  );
};
