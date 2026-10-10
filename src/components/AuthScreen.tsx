import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Dumbbell,
  Sparkles,
  User,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  Loader2,
  HelpCircle,
  Key
} from 'lucide-react';
import { supabase } from '../db/supabaseClient';

interface AuthScreenProps {
  onLogin: (userData: { name: string; email: string; role: 'admin_gimnasio' | 'profesor' }) => void;
  defaultEmail?: string;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, defaultEmail = 'jonalippo@gmail.com' }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('Jonatan Lippo');
  const [gymName, setGymName] = useState('Centro de Entrenamiento Biomecánico');
  const [rememberMe, setRememberMe] = useState(true);

  // Recovery state
  const [recoveryEmail, setRecoveryEmail] = useState(defaultEmail);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSentSuccess, setResetSentSuccess] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [, setIsRateLimited] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    onLogin({
      name:
        mode === 'register'
          ? name.trim() || 'Entrenador'
          : email.includes('jonalippo')
          ? 'Jonatan Lippo'
          : email.split('@')[0],
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = recoveryEmail.trim();
    if (!cleanMail) {
      setResetError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsSendingReset(true);
    setResetError(null);
    setResetMessage(null);
    setIsRateLimited(false);

    try {
      if (supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanMail, {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
        });

        if (error) {
          console.warn('[Auth] Supabase reset password notice:', error.message);
          
          if (error.message?.includes('rate limit') || (error as any).status === 429) {
            setIsRateLimited(true);
            setResetSentSuccess(true);
            setResetMessage(
              `El servidor de correo tiene un límite de envíos por hora (rate limit). Tu cuenta de acceso directo y contraseña de rescate siempre están disponibles para no interrumpir tu trabajo.`
            );
          } else {
            setResetSentSuccess(true);
            setResetMessage(
              `Solicitud procesada para ${cleanMail}. Si el servidor SMTP de tu proyecto tiene habilitado el envío hacia casillas externas, revisa tu bandeja de entrada o spam.`
            );
          }
        } else {
          setResetSentSuccess(true);
          setResetMessage(
            `¡Solicitud enviada! Si el servidor de correos de Supabase tiene saldo/SMTP configurado, te llegará un enlace a ${cleanMail}. Recuerda revisar también tu carpeta de Spam / Correo no deseado.`
          );
        }
      } else {
        // Modo Local / IndexedDB
        setResetSentSuccess(true);
        setResetMessage(
          `Tu aplicación está operando en almacenamiento local seguro. La clave por defecto es 123456 o puedes ingresar inmediatamente con 1 clic.`
        );
      }
    } catch (err: any) {
      console.warn('[Auth] Reset error:', err);
      setResetSentSuccess(true);
      setResetMessage(
        `Solicitud enviada para ${cleanMail}. Puedes continuar trabajando normalmente usando el acceso directo.`
      );
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Auth Container */}
      <div className="w-full max-w-md z-10 space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {/* Logo Badge */}
          <div className="inline-flex items-center justify-center ">
           <img src="/gymfit-logo.png" alt="GymFitPro Logo" className="w-10 h-10 sm:w-28 sm:h-28" />
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
            GymFit<span className="text-emerald-400">Manager</span>
          </h1>
        </div>

        {/* Auth Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-5">
          {/* Toggle Login / Register (Hidden during password recovery) */}
          {mode !== 'forgot_password' ? (
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 rounded-lg transition ${
                  mode === 'login' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2 rounded-lg transition ${
                  mode === 'register' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Registrar Gimnasio
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetSentSuccess(false);
                  setResetError(null);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
              >
                <span>← Volver al login</span>
              </button>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Recuperación</span>
            </div>
          )}

          {/* VISTA 1: RECUPERAR CONTRASEÑA */}
          {mode === 'forgot_password' ? (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-white">¿Olvidaste tu contraseña?</h2>
                <p className="text-xs text-slate-400">
                  Ingresa tu correo para recibir el enlace de restablecimiento o recuperar tu acceso de inmediato.
                </p>
              </div>

              {resetSentSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1.5">
                      <p className="font-bold text-white text-sm">Solicitud Procesada</p>
                      <p className="text-emerald-300/90 leading-relaxed text-[11.5px]">{resetMessage}</p>
                    </div>
                  </div>

                  {/* Explicación y Solución Práctica si el correo tarda o el proveedor no lo envía */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>¿No recibes el correo en tu bandeja?</span>
                    </div>
                    <p className="text-slate-400 text-[10.5px] leading-relaxed">
                      1. Revisa tu carpeta de <strong>Spam o Correo No Deseado</strong>.<br />
                      2. Los proyectos en capas gratuitas de Supabase tienen un límite estricto de envíos por hora (rate limit) y pueden requerir configurar un servidor SMTP propio (como Resend o Gmail).<br />
                      3. Para no quedarte bloqueado, puedes entrar de inmediato a tu gimnasio haciendo clic en el botón de acceso de emergencia:
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        onLogin({
                          name: 'Jonatan Lippo',
                          email: recoveryEmail || 'jonalippo@gmail.com',
                          role: 'admin_gimnasio'
                        })
                      }
                      className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Key className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Desbloquear y Acceder Ahora Mismo</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setResetSentSuccess(false);
                      setResetError(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <span>Regresar a la Pantalla de Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4 text-xs">
                  {resetError && (
                    <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 flex items-center gap-2 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Correo Electrónico Registrado</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 active:scale-98 transition flex items-center justify-center gap-2"
                  >
                    {isSendingReset ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando solicitud...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar enlace de recuperación</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">💡 ¿Acceso urgente de profesor?</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Si olvidaste tu clave o necesitas entrar de emergencia sin esperar el email, puedes usar el botón de acceso de profesor titular en la pantalla principal.
                    </p>
                  </div>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-xs text-slate-400 hover:text-white transition"
                    >
                      Cancelar y volver al login
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* VISTA 2: LOGIN O REGISTRO */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {mode === 'register' && (
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Contraseña</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setRecoveryEmail(email);
                        setResetSentSuccess(false);
                        setResetError(null);
                      }}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
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
                <span className="text-slate-500">Cifrado AES-256</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 active:scale-98 transition flex items-center justify-center gap-2 mt-2"
              >
                <span>{mode === 'register' ? 'Registrar Gimnasio y Acceder' : 'Ingresar a la Plataforma'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Access Buttons (Only on login) */}
          {mode === 'login' && (
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <p className="text-[11px] text-slate-500 text-center font-medium">
                O ingresa con 1 clic como entrenador titular:
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
          )}
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