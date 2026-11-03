import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  User,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Send,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';
import { supabase, checkIfUserIsActive } from '../db/supabaseClient';

// Número de WhatsApp oficial del administrador Jonatan Lippo (+54 9 249 461-8560)
// Formato internacional wa.me para celulares de Argentina: código país 54 + prefijo 9 + código área (249) + número local
export const ADMIN_WHATSAPP_NUMBER = '5492494618560';

/**
 * Normaliza cualquier formato de número argentino (+54 249 ..., 0249..., etc.)
 * al estándar que requiere WhatsApp en https://wa.me/<numero> para abrir DIRECTO el chat sin selector de contactos.
 */
export const formatWhatsAppNumber = (phoneStr: string): string => {
  if (!phoneStr) return '5492494618560';
  let cleaned = phoneStr.replace(/\D/g, '');
  if (cleaned.startsWith('54') && !cleaned.startsWith('549')) {
    cleaned = '549' + cleaned.slice(2);
  } else if (!cleaned.startsWith('54')) {
    cleaned = '549' + cleaned;
  }
  return cleaned;
};

export interface AuthUserData {
  id: string;
  name: string;
  email: string;
  role: 'admin_gimnasio' | 'profesor';
  gymName?: string;
}

interface AuthScreenProps {
  onLogin: (userData: AuthUserData) => void;
  defaultEmail?: string;
}

type AuthMode = 'login' | 'register' | 'forgot_password' | 'awaiting_confirmation' | 'update_password';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, defaultEmail = '' }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Credenciales y datos de usuario (inicia siempre vacío para que se vea únicamente el placeholder)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [gymName, setGymName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Campos para restablecer / crear nueva contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Visibilidad de contraseñas (ojito)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Estados de carga y feedback
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Estados de confirmación de email / permiso
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [isResendingConfirmation, setIsResendingConfirmation] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Estados para recuperación de contraseña (inicia vacío para mostrar placeholder)
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSentSuccess, setResetSentSuccess] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const confirmationRedirectRef = useRef(false);

  // Determina si el correo es la cuenta principal del propietario/administrador Jonatan Lippo
  const isOwnerEmail = (mail: string): boolean => {
    if (!mail) return false;
    const clean = mail.trim().toLowerCase();
    return clean === 'jonalippo@gmail.com' || clean === 'prof-1';
  };

  // ============================================================================
  // DETECCIÓN AUTOMÁTICA DE ENLACES DE SUPABASE (RECUPERACIÓN Y CONFIRMACIÓN)
  // ============================================================================
  useEffect(() => {
    const checkAuthUrl = () => {
      try {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const fullUrl = window.location.href || '';

        if (
          hash.includes('type=recovery') ||
          search.includes('type=recovery') ||
          fullUrl.includes('type=recovery') ||
          (hash.includes('access_token=') && hash.includes('type=recovery'))
        ) {
          setMode('update_password');
          setAuthSuccess('✓ Enlace de recuperación verificado con éxito. Ingresa tu nueva contraseña a continuación.');
        } else if (
          hash.includes('type=signup') ||
          search.includes('type=signup') ||
          hash.includes('type=email_change') ||
          fullUrl.includes('type=signup')
        ) {
          // La confirmación verifica el correo, pero no autoriza el acceso.
          // Se cierra la sesión creada por el enlace para exigir un inicio de
          // sesión posterior y la activación explícita del administrador.
          confirmationRedirectRef.current = true;
          if (supabase) {
            supabase.auth.signOut().catch(() => {});
          }
          window.history.replaceState({}, document.title, window.location.pathname);
          setMode('login');
          setAuthSuccess('✓ Cuenta confirmada. Tu solicitud queda pendiente de activación por el administrador. Cuando sea aprobada, inicia sesión con tu correo y contraseña.');
        }
      } catch (err) {
        console.warn('[Auth] Error checking auth URL:', err);
      }
    };

    checkAuthUrl();

    if (supabase) {
      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setMode('update_password');
          setAuthError(null);
          setAuthSuccess('✓ Enlace de recuperación validado correctamente. Escribe tu nueva contraseña a continuación.');
          if (session?.user?.email) {
            setEmail(session.user.email);
            setRecoveryEmail(session.user.email);
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          if (confirmationRedirectRef.current) {
            if (supabase) await supabase.auth.signOut();
            return;
          }

          const user = session.user;
          const userEmail = (user.email || '').toLowerCase().trim();
          const isOwner = isOwnerEmail(userEmail);

          if (!isOwner) {
            const isActivo = await checkIfUserIsActive(user.id);
            if (!isActivo) {
              if (supabase) await supabase.auth.signOut();
              setAuthError('Tu cuenta se encuentra desactivada por el administrador.');
              return;
            }
          }

          const userMetadata = user.user_metadata || {};
          const userName = userMetadata.full_name || (isOwner ? 'Jonatan Lippo' : userEmail.split('@')[0]);
          const userGym = userMetadata.gym_name || (isOwner ? 'Centro de Entrenamiento' : 'Mi Gimnasio');

          handleRememberEmail(userEmail);

          onLogin({
            id: isOwner ? 'prof-1' : user.id,
            name: userName,
            email: userEmail,
            role: 'admin_gimnasio',
            gymName: userGym
          });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // ============================================================================
  // VALIDACIONES DE SEGURIDAD ESTRICTAS
  // ============================================================================

  const isEmailValid = useMemo(() => {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }, [email]);

  const passwordSecurity = useMemo(() => {
    const pwd = password || '';
    const hasMinLength = pwd.length > 8;
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd);

    const checksPassed = [hasMinLength, hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
    const isStrong = hasMinLength && hasLetter && hasNumber && hasSpecial;

    return {
      hasMinLength,
      hasLetter,
      hasNumber,
      hasSpecial,
      checksPassed,
      isStrong
    };
  }, [password]);

  const newPasswordSecurity = useMemo(() => {
    const pwd = newPassword || '';
    const hasMinLength = pwd.length > 8;
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd);

    const checksPassed = [hasMinLength, hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
    const isStrong = hasMinLength && hasLetter && hasNumber && hasSpecial;

    return {
      hasMinLength,
      hasLetter,
      hasNumber,
      hasSpecial,
      checksPassed,
      isStrong
    };
  }, [newPassword]);

  const getProfesorIdForEmail = (rawEmail: string): string => {
    const clean = rawEmail.trim().toLowerCase();
    if (isOwnerEmail(clean)) {
      return 'prof-1';
    }
    return `prof_${clean.replace(/[^a-zA-Z0-9]/g, '_')}`;
  };

  const handleRememberEmail = (userEmail: string) => {
    try {
      if (rememberMe) {
        localStorage.setItem('fitpro_saved_email', userEmail);
      } else {
        localStorage.removeItem('fitpro_saved_email');
      }
    } catch {}
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!isEmailValid) {
      setAuthError('Por favor ingresa un correo electrónico válido (ej: profesor@tudominio.com).');
      return;
    }

    if (!password.trim()) {
      setAuthError('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      if (!supabase) {
        setAuthError('El servicio de autenticación no está disponible. Intenta nuevamente cuando Supabase esté activo.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error) {
        console.warn('[Supabase Auth Error]', error.message);

        if (error.message?.toLowerCase().includes('email not confirmed')) {
          setAuthError('Primero confirma tu correo desde el enlace que te enviamos.');
          return;
        }

        if (error.message?.toLowerCase().includes('invalid login credentials')) {
          setAuthError('Correo o contraseña incorrectos. Si eliminaste esta cuenta, debes crearla nuevamente desde “Crear Cuenta Nueva”.');
          return;
        }

        setAuthError(error.message || 'Error al iniciar sesión.');
        return;
      }

      if (data?.user) {
        if (!isOwnerEmail(cleanEmail)) {
          const isActivo = await checkIfUserIsActive(data.user.id);
          if (!isActivo) {
            await supabase.auth.signOut();
            setConfirmationEmail(cleanEmail);
            setMode('awaiting_confirmation');
            setAuthError('Tu cuenta está pendiente de activación por el administrador o fue desactivada.');
            return;
          }
        }

        handleRememberEmail(cleanEmail);
        const userId = data.user.id;
        const userMetadata = data.user.user_metadata || {};
        const userName =
          userMetadata.full_name || (isOwnerEmail(cleanEmail) ? 'Jonatan Lippo' : cleanEmail.split('@')[0]);
        const userGym = userMetadata.gym_name || 'Gimnasio';

        onLogin({
          id: isOwnerEmail(cleanEmail) ? 'prof-1' : userId,
          name: userName,
          email: cleanEmail,
          role: 'admin_gimnasio',
          gymName: userGym
        });
      }
    } catch (err: any) {
      console.error('[Login Error]', err);
      setAuthError('Ocurrió un error inesperado al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!isEmailValid) {
      setAuthError('El correo ingresado no es válido. Debe tener formato: usuario@dominio.com');
      return;
    }

    if (!passwordSecurity.isStrong) {
      setAuthError(
        'La contraseña debe tener más de 8 caracteres, e incluir letras, números y al menos un signo o carácter especial.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    if (!name.trim()) {
      setAuthError('Por favor ingresa tu nombre y apellido.');
      return;
    }

    if (!gymName.trim()) {
      setAuthError('Por favor ingresa el nombre de tu gimnasio o centro de entrenamiento.');
      return;
    }

    setIsLoading(true);

    try {
      if (supabase) {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: name.trim(),
              gym_name: gymName.trim(),
              role: 'admin_gimnasio'
            },
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
          }
        });

        if (error) {
          console.warn('[Supabase SignUp Error]', error);
          const errorMsg = error.message?.toLowerCase() || '';
          if (errorMsg.includes('already registered')) {
            setAuthError('Este correo electrónico ya se encuentra registrado. Inicia sesión o recupera tu contraseña.');
          } else if (
            errorMsg.includes('rate limit') ||
            errorMsg.includes('over_email_send_rate_limit') ||
            (error as any).status === 429
          ) {
            // Límite horario de correos en Supabase (tasa gratuita de 3-4 envíos por hora)
            setAuthError(
              'Aviso de Supabase: Se alcanzó el límite horario del servidor de correos (máx. 3 o 4 por hora). Si ya abonaste la membresía, pulsa abajo para avisar al Administrador por WhatsApp y activar tu cuenta directamente sin esperar el correo.'
            );
            // Mostramos la pantalla de confirmación/pago para que pueda continuar por WhatsApp
            setConfirmationEmail(cleanEmail);
            setMode('awaiting_confirmation');
            return;
          } else {
            setAuthError(error.message || 'Error al procesar el registro.');
          }
          return;
        }

        // Registrar en la tabla profesores (los usuarios nuevos inician inactivos hasta abonar membresía y ser aprobados)
        const isOwner = isOwnerEmail(cleanEmail);
        const profId = isOwner ? 'prof-1' : `prof_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
        try {
          await supabase.from('profesores').upsert({
            id: profId,
            auth_user_id: signUpData?.user?.id || `auth-${Date.now()}`,
            nombre: name.trim(),
            email: cleanEmail,
            gym_name: gymName.trim(),
            rol: 'admin_gimnasio',
            activo: isOwner ? true : false,
            created_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch (err) {
          console.warn('[Supabase SignUp Profesor]', err);
        }

        setConfirmationEmail(cleanEmail);
        setMode('awaiting_confirmation');
        return;
      }

      setConfirmationEmail(cleanEmail);
      setMode('awaiting_confirmation');
    } catch (err: any) {
      console.error('[Register Error]', err);
      setAuthError('Ocurrió un error al procesar tu solicitud de registro.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!confirmationEmail) return;
    setIsResendingConfirmation(true);
    setResendStatus(null);

    try {
      if (supabase) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: confirmationEmail
        });
        if (error) {
          const msg = error.message?.toLowerCase() || '';
          if (
            msg.includes('rate limit') ||
            msg.includes('over_email_send_rate_limit') ||
            (error as any).status === 429
          ) {
            setResendStatus('Aviso: Límite horario de envío alcanzado en el servidor de correos. Puedes avisar directamente por WhatsApp al Administrador para habilitar tu acceso.');
          } else {
            setResendStatus(`Aviso: ${error.message}`);
          }
        } else {
          setResendStatus('✓ Nuevo correo de confirmación enviado a tu casilla.');
        }
      } else {
        setResendStatus('✓ Nuevo correo de confirmación enviado a tu casilla.');
      }
    } catch {
      setResendStatus('✓ Solicitud de reenvío procesada.');
    } finally {
      setIsResendingConfirmation(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMail = recoveryEmail.trim().toLowerCase();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanMail)) {
      setResetError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsSendingReset(true);
    setResetError(null);
    setResetMessage(null);

    try {
      if (supabase) {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(cleanMail, {
          redirectTo: redirectUrl
        });

        if (error) {
          console.warn('[Auth] Supabase reset password notice:', error.message);
          setResetSentSuccess(false);

          if (error.code === 'over_email_send_rate_limit') {
            setResetError(
              'Supabase alcanzó el límite de correos de recuperación. Espera al menos una hora antes de volver a intentarlo.'
            );
          } else if (error.code === 'email_address_not_authorized') {
            setResetError(
              'El correo no está autorizado por el servicio de envío de Supabase. Se debe configurar un SMTP propio o autorizar esta dirección en el proyecto.'
            );
          } else {
            setResetError(`No se pudo enviar el enlace de recuperación: ${error.message}`);
          }
        } else {
          setResetSentSuccess(true);
          setResetMessage(
            `¡Solicitud enviada! Te enviamos un enlace de restablecimiento seguro a ${cleanMail}. Al hacer clic en el enlace, podrás ingresar tu nueva contraseña.`
          );
        }
      } else {
        setResetSentSuccess(false);
        setResetError('La recuperación de contraseña no está disponible porque Supabase no está configurado.');
      }
    } catch (err: any) {
      console.warn('[Auth] Reset error:', err);
      setResetSentSuccess(false);
      setResetError(`No se pudo enviar el enlace de recuperación: ${err?.message || 'error de conexión'}`);
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!newPasswordSecurity.isStrong) {
      setAuthError(
        'La nueva contraseña debe tener más de 8 caracteres, e incluir letras, números y al menos un signo o carácter especial (!@#$%...)'
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setAuthError('Las contraseñas no coinciden. Por favor verifica que sean exactamente iguales.');
      return;
    }

    setIsLoading(true);

    try {
      const activeEmail = email.trim().toLowerCase() || recoveryEmail.trim().toLowerCase() || 'jonalippo@gmail.com';

      if (supabase) {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) {
          console.warn('[Supabase Update Password Error]', error);
          setAuthError(`No se pudo actualizar la contraseña: ${error.message}`);
          return;
        }

        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch {}

        setAuthSuccess('¡Excelente! Tu nueva contraseña ha sido establecida con éxito.');

        const user = data?.user;
        const userEmail = user?.email || activeEmail;
        const userMetadata = user?.user_metadata || {};
        const userName =
          userMetadata.full_name || (isOwnerEmail(userEmail) ? 'Jonatan Lippo' : userEmail.split('@')[0]);
        const userGym = userMetadata.gym_name || 'Gimnasio';

        handleRememberEmail(userEmail);

        setTimeout(() => {
          onLogin({
            id: isOwnerEmail(userEmail) ? 'prof-1' : (user?.id || getProfesorIdForEmail(userEmail)),
            name: userName,
            email: userEmail,
            role: 'admin_gimnasio',
            gymName: userGym
          });
        }, 800);
        return;
      }

      setAuthError('No se puede restablecer una contraseña sin conexión a Supabase. Solicita un enlace de recuperación cuando el servicio esté disponible.');
    } catch (err: any) {
      console.error('[Update Password Error]', err);
      setAuthError('Ocurrió un error al guardar la nueva contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Auth Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        <div className="text-center space-y-2">
          <img src="/GymFitLogo02.webp" alt="FitPro Logo" className="w-55 h-20 mx-auto md:w-80 md:h-20" />
        </div>

        {/* Auth Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-5">
          {mode === 'login' || mode === 'register' ? (
            <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className={`flex-1 py-2 rounded-lg transition ${
                  mode === 'login' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className={`flex-1 py-2 rounded-lg transition ${
                  mode === 'register' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Crear Cuenta Nueva
              </button>
            </div>
          ) : null}

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 space-y-1">
                <span className="leading-relaxed block">{authError}</span>
                {isOwnerEmail(email) && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setRecoveryEmail(email);
                        setAuthError(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
                    >
                      Restablecer por correo
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {authSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span className="leading-relaxed">{authSuccess}</span>
            </div>
          )}

          {/* VISTA 1: ESPERANDO AUTORIZACIÓN / PAGO DE MEMBRESÍA */}
          {mode === 'awaiting_confirmation' && (
            <div className="text-center py-2 space-y-4 text-xs animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600/30 to-teal-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/40">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Membresía Requerida · Activación Pendiente
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">¡Cuenta Registrada con Éxito!</h3>
                <p className="text-slate-300 text-xs leading-relaxed max-w-sm mx-auto">
                  Para tener acceso a GymFit Manager debes confirmar tu correo y abonar la membresía de la plataforma.
                </p>
              </div>

              {/* Tarjeta con los datos del usuario registrado */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium">Correo registrado:</span>
                  <span className="text-emerald-400 font-mono font-bold text-xs">{confirmationEmail || email}</span>
                </div>
                {gymName && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-medium">Gimnasio:</span>
                    <span className="text-white font-semibold text-xs">{gymName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Estado del Acceso:</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Pendiente de Pago y Habilitación</span>
                  </span>
                </div>
              </div>

              {/* Pasos a seguir */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 text-left text-[11px] space-y-2 leading-relaxed">
                <p className="font-bold text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Pasos para habilitar tu cuenta:</span>
                </p>
                <div className="space-y-1.5 text-slate-400 pl-1">
                  <p>1. <strong className="text-slate-200">Revisa tu correo:</strong> Haz clic en el enlace de confirmación que te enviamos (revisa también tu carpeta de Spam).</p>
                  <p>2. <strong className="text-slate-200">Abona la membresía:</strong> Realiza el pago correspondiente para el uso de la aplicación.</p>
                  <p>3. <strong className="text-slate-200">Avisa al Administrador:</strong> Notifícale por WhatsApp con el botón aquí abajo para que active tu cuenta desde su panel de control.</p>
                </div>
              </div>

              {/* Botón WhatsApp: Envía directo al chat de Jonatan Lippo (+54 9 249 461-8560) sin selector */}
              <a
                href={`https://wa.me/${formatWhatsAppNumber(ADMIN_WHATSAPP_NUMBER)}?text=${encodeURIComponent(
                  `Hola Jonatan, acabo de registrarme en GymFit Manager con el correo "${confirmationEmail || email}"${gymName ? ` para el gimnasio "${gymName}"` : ''}. Ya realicé el pago de mi membresía para solicitar la habilitación de mi cuenta.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-95"
              >
                <MessageCircle className="w-4 h-4 text-white shrink-0 fill-current" />
                <span>Avisar al Administrador por WhatsApp</span>
              </a>

              {resendStatus && (
                <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[11px]">
                  {resendStatus}
                </div>
              )}

              {/* Botones secundarios */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResendingConfirmation}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 disabled:opacity-50 text-slate-300 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  {isResendingConfirmation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Reenviando correo...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>¿No llegó el correo? Reenviar confirmación</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-transparent hover:bg-slate-800/60 border border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al Login</span>
                </button>
              </div>
            </div>
          )}

          {/* VISTA 2: RECUPERAR CONTRASEÑA */}
          {mode === 'forgot_password' && (
            <div className="space-y-4 text-xs animate-in fade-in duration-300">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Recuperar Acceso</h3>
                <p className="text-slate-400 text-xs">
                  Ingresa tu correo para recibir el enlace de restablecimiento seguro.
                </p>
              </div>

              {resetMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
                  <p>{resetMessage}</p>
                  <p className="text-[11px] text-slate-300">
                    Al abrir el enlace que recibas en tu correo, la pantalla te pedirá directamente tu nueva contraseña.
                  </p>
                </div>
              )}

              {resetError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              {!resetSentSuccess ? (
                <form onSubmit={handlePasswordReset} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Correo de la cuenta</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="tu-correo@gimnasio.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold transition flex items-center justify-center gap-2"
                  >
                    {isSendingReset ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enviando enlace seguro...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar enlace de restablecimiento</span>
                      </>
                    )}
                  </button>

                </form>
              ) : (
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('update_password');
                      setEmail(recoveryEmail);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Establecer nueva contraseña ahora</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetSentSuccess(false);
                  setResetMessage(null);
                  setResetError(null);
                }}
                className="w-full py-2 text-slate-400 hover:text-white transition font-semibold"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          )}

          {/* VISTA 3: CREAR NUEVA CONTRASEÑA */}
          {mode === 'update_password' && (
            <form onSubmit={handleUpdatePasswordSubmit} className="space-y-4 text-xs animate-in fade-in duration-300">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Establecer Nueva Contraseña</h3>
                <p className="text-slate-400 text-xs">
                  Crea tu nueva contraseña segura para tu cuenta ({email || recoveryEmail || 'Jonatan Lippo'}).
                </p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 9 caracteres con letras, números y signos"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                    aria-label={showNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-0.5"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {newPassword && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-[11px]">
                    <div className="text-slate-400 font-semibold mb-1 flex items-center justify-between">
                      <span>Seguridad de contraseña:</span>
                      <span
                        className={
                          newPasswordSecurity.isStrong
                            ? 'text-emerald-400 font-bold'
                            : newPasswordSecurity.checksPassed >= 2
                            ? 'text-amber-400 font-bold'
                            : 'text-rose-400 font-bold'
                        }
                      >
                        {newPasswordSecurity.isStrong
                          ? 'Excelente ✓'
                          : newPasswordSecurity.checksPassed >= 2
                          ? 'Media'
                          : 'Débil'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div
                        className={`flex items-center gap-1 ${
                          newPasswordSecurity.hasMinLength ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Más de 8 caracteres</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          newPasswordSecurity.hasLetter ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Letras (a-z, A-Z)</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          newPasswordSecurity.hasNumber ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Números (0-9)</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          newPasswordSecurity.hasSpecial ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Signos (!@#$%...)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Confirmar Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-0.5"
                  >
                    {showConfirmNewPassword ? (
                      <EyeOff className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmNewPassword && (
                  <p
                    className={`text-[11px] mt-1 ${
                      newPassword === confirmNewPassword ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {newPassword === confirmNewPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 transition flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando y verificando...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Guardar Contraseña e Ingresar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className="w-full py-2 text-slate-400 hover:text-white transition font-semibold text-center"
              >
                Volver a Iniciar Sesión
              </button>
            </form>
          )}

          {/* VISTA 4: INICIAR SESIÓN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="profesor@gimnasio.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Contraseña</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setRecoveryEmail(email || '');
                      setResetSentSuccess(false);
                      setResetError(null);
                      setAuthError(null);
                    }}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña segura"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-0.5 rounded focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                {isOwnerEmail(email) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('update_password');
                      setAuthError(null);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Crear nueva contraseña
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 active:scale-98 transition flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar a la Plataforma</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* VISTA 5: CREAR CUENTA NUEVA */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre y Apellido del Profesor</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Martín González"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre del Gimnasio / Box</label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    placeholder="Ej. PowerFit Training Center"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Correo Electrónico Oficial</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="profesor@gimnasio.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                  />
                </div>
                {email && !isEmailValid && (
                  <p className="text-[11px] text-amber-400 mt-1">Formato de correo inválido.</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 9 caracteres con letras, números y signos"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-0.5 rounded focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {password && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-[11px]">
                    <div className="text-slate-400 font-semibold mb-1 flex items-center justify-between">
                      <span>Requisitos de seguridad:</span>
                      <span
                        className={
                          passwordSecurity.isStrong
                            ? 'text-emerald-400 font-bold'
                            : passwordSecurity.checksPassed >= 2
                            ? 'text-amber-400 font-bold'
                            : 'text-rose-400 font-bold'
                        }
                      >
                        {passwordSecurity.isStrong
                          ? 'Segura ✓'
                          : passwordSecurity.checksPassed >= 2
                          ? 'Media'
                          : 'Insegura'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div
                        className={`flex items-center gap-1 ${
                          passwordSecurity.hasMinLength ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Más de 8 caracteres</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          passwordSecurity.hasLetter ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Letras (a-z, A-Z)</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          passwordSecurity.hasNumber ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Números (0-9)</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          passwordSecurity.hasSpecial ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Signos especiales (!@#...)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-0.5 rounded focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && (
                  <p
                    className={`text-[11px] mt-1 ${
                      password === confirmPassword ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {password === confirmPassword ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 active:scale-98 transition flex items-center justify-center mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creando cuenta y enviando correo...</span>
                  </>
                ) : (
                  <>
                    <span>Solicitar registro y permiso de cuenta</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
