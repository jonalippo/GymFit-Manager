import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Alumno, Grupo, Rutina, EvaluacionClinica, RolProfesor } from './types';
import {
  openDB,
  seedInitialDataIfEmpty,
  getAlumnos,
  getGrupos,
  getRutinasByAlumno,
  getEvaluacionClinica,
  saveAlumno,
  deleteAlumno,
  clearAllLocalAlumnos,
  saveGrupo,
  deleteGrupo,
  saveRutina,
  deleteRutina,
  saveEvaluacionClinica,
  subscribeToDBChanges
} from './db/indexedDb';

import { Header } from './components/Header';
import { BottomDock } from './components/BottomDock';
import { StudentList } from './components/StudentList';
import { GroupManager } from './components/GroupManager';
import { RoutineSpreadsheet } from './components/RoutineSpreadsheet';
import { ClinicalEvaluationModal } from './components/ClinicalEvaluationModal';
import { DailyTrackingModal } from './components/DailyTrackingModal';
import { AuthScreen } from './components/AuthScreen';
import { SupabaseSqlModal } from './components/SupabaseSqlModal';
import { PaymentsManager } from './components/PaymentsManager';
import { DashboardHome } from './components/DashboardHome';
import {
  isSupabaseConfigured,
  fetchStudentsFromSupabase,
  fetchRoutinesFromSupabase,
  saveStudentToSupabase,
  deleteStudentFromSupabase,
  clearAllStudentsFromSupabase,
  fetchGroupsFromSupabase,
  saveGroupToSupabase,
  deleteGroupFromSupabase,
  saveRoutineToSupabase,
  deleteRoutineFromSupabase
} from './db/supabaseClient';

import {
  Home,
  Users,
  ClipboardList,
  Activity,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Brain,
  Layers,
  DollarSign,
  X
} from 'lucide-react';

export interface PagoCuota {
  id: string;
  alumno_id: string;
  alumno_nombre: string;
  grupo_id?: string;
  grupo_nombre?: string;
  monto: number;
  fecha_pago: string;
  fecha_vencimiento: string;
  mes_correspondiente: string;
  metodo_pago?: string;
  notas?: string;
  created_at: string;
}

interface AuthUser {
  name: string;
  email: string;
  role: 'admin_gimnasio' | 'profesor';
}

export default function App() {
  const [loading, setLoading] = useState(true);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('fitpro_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);

  // Pagos en memoria y persistencia local
  const [pagos, setPagos] = useState<PagoCuota[]>(() => {
    try {
      const saved = localStorage.getItem('fitpro_local_pagos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('fitpro_selected_student_id') || null;
    } catch {
      return null;
    }
  });

  // Modo Sala: Atletas fijados en el dock inferior
  const [activeDockStudents, setActiveDockStudents] = useState<Alumno[]>([]);
  const isInitialLoadedRef = useRef(false);

  // Navigation View: Recuerda la pantalla donde te encontrabas al recargar
  const [activeView, setActiveView] = useState<'home' | 'alumnos' | 'grupos' | 'pagos' | 'rutina' | 'evaluacion'>(() => {
    try {
      const saved = localStorage.getItem('fitpro_active_view');
      if (saved && ['home', 'alumnos', 'grupos', 'pagos', 'rutina', 'evaluacion'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'home';
  });

  useEffect(() => {
    try {
      localStorage.setItem('fitpro_active_view', activeView);
    } catch {}
  }, [activeView]);

  useEffect(() => {
    try {
      if (selectedStudentId) {
        localStorage.setItem('fitpro_selected_student_id', selectedStudentId);
      }
    } catch {}
  }, [selectedStudentId]);

  // Persistir los alumnos en la sala activa durante la sesión (para que no se pierdan al actualizar/F5)
  useEffect(() => {
    if (!isInitialLoadedRef.current) return;
    try {
      if (currentUser) {
        const ids = activeDockStudents.map((a) => a.id);
        localStorage.setItem('fitpro_dock_student_ids', JSON.stringify(ids));
      }
    } catch {}
  }, [activeDockStudents, currentUser]);

  // Selected Student Routines & Evaluation
  const [currentRutinas, setCurrentRutinas] = useState<Rutina[]>([]);
  const [currentEvaluacion, setCurrentEvaluacion] = useState<EvaluacionClinica | null>(null);

  // Caché de rutinas por alumno
  const [routinesByStudent, setRoutinesByStudent] = useState<Record<string, Rutina[]>>({});
  const [studentActiveDays, setStudentActiveDays] = useState<Record<string, string>>({});
  const [studentActiveRoutines, setStudentActiveRoutines] = useState<Record<string, string>>({});
  const isSavingRef = useRef(false);

  // Modals
  const [isDailyLogOpen, setIsDailyLogOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [dailyLogStudent, setDailyLogStudent] = useState<Alumno | null>(null);
  const initialCloudSyncDone = useRef(false);

  // Feedback Toast
  const [isCloudConnected, setIsCloudConnected] = useState(() => isSupabaseConfigured());
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  const showToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  }, []);

  // Carga de datos local e inicialización
  const loadData = useCallback(async () => {
    try {
      await seedInitialDataIfEmpty();
      let allAlumnos = await getAlumnos();
      let allGrupos = await getGrupos();

      // Sincronización inteligente bidireccional con Supabase si está configurado en el primer inicio
      if (isSupabaseConfigured() && !initialCloudSyncDone.current) {
        initialCloudSyncDone.current = true;
        try {
          const cloudAlumnos = await fetchStudentsFromSupabase();
          if (cloudAlumnos && cloudAlumnos.length > 0) {
            // Unir alumnos para nunca perder alumnos locales creados previamente
            const mergedAlumnosMap = new Map<string, Alumno>();
            allAlumnos.forEach((a) => mergedAlumnosMap.set(a.id, a));
            cloudAlumnos.forEach((a) => mergedAlumnosMap.set(a.id, a));
            allAlumnos = Array.from(mergedAlumnosMap.values());

            for (const a of allAlumnos) {
              await saveAlumno(a);
              const cloudRuts = await fetchRoutinesFromSupabase(a.id);
              const localRuts = await getRutinasByAlumno(a.id);

              if (cloudRuts && cloudRuts.length > 0) {
                for (const cr of cloudRuts) {
                  const lr = localRuts.find((r) => r.id === cr.id);
                  const localEjsCount = lr?.bloques?.reduce((acc, b) => acc + (b.ejercicios?.length || 0), 0) || 0;
                  const cloudEjsCount = cr.bloques?.reduce((acc, b) => acc + (b.ejercicios?.length || 0), 0) || 0;

                  if (!lr) {
                    await saveRutina(cr);
                  } else if (localEjsCount > 0 && cloudEjsCount === 0) {
                    // Proteger local: la nube está vacía pero localmente hay rutina armada
                    saveRoutineToSupabase(lr).catch((e) => console.warn('[Sync to Cloud]', e));
                  } else if (localEjsCount > cloudEjsCount) {
                    // Proteger local: localmente hay más ejercicios/separadores
                    saveRoutineToSupabase(lr).catch((e) => console.warn('[Sync to Cloud]', e));
                  } else if (cloudEjsCount >= localEjsCount) {
                    // La nube tiene la misma o más información: verificar fecha
                    if (!lr.updated_at || new Date(cr.updated_at).getTime() > new Date(lr.updated_at).getTime()) {
                      await saveRutina(cr);
                    } else if (new Date(lr.updated_at).getTime() > new Date(cr.updated_at).getTime()) {
                      saveRoutineToSupabase(lr).catch((e) => console.warn('[Sync to Cloud]', e));
                    }
                  }
                }
                // Si hay rutinas locales que no están en la nube, subirlas
                for (const lr of localRuts) {
                  if (!cloudRuts.some((cr) => cr.id === lr.id)) {
                    saveRoutineToSupabase(lr).catch((e) => console.warn('[Upload local to Cloud]', e));
                  }
                }
              } else if (localRuts && localRuts.length > 0) {
                // Si la nube no tiene rutinas para este alumno pero localmente sí tenemos:
                for (const lr of localRuts) {
                  saveRoutineToSupabase(lr).catch((e) => console.warn('[Seed local to Cloud]', e));
                }
              }
            }
          }

          const cloudGrupos = await fetchGroupsFromSupabase();
          if (cloudGrupos && cloudGrupos.length > 0) {
            allGrupos = cloudGrupos;
            for (const g of cloudGrupos) {
              await saveGrupo(g);
            }
          }
        } catch (e) {
          console.warn('[Supabase Initial Sync]', e);
        }
      }

      setAlumnos(allAlumnos);
      setGrupos(allGrupos);

      // Pre-cargar rutinas en memoria caché
      const routinesCacheMap: Record<string, Rutina[]> = {};
      await Promise.all(
        allAlumnos.map(async (a) => {
          try {
            const ruts = await getRutinasByAlumno(a.id);
            if (ruts && ruts.length > 0) {
              routinesCacheMap[a.id] = ruts;
            }
          } catch (e) {
            console.warn('[Cache routine]', e);
          }
        })
      );
      setRoutinesByStudent((prev) => ({ ...prev, ...routinesCacheMap }));

      // Determinar alumno activo desde localStorage si existe
      let savedActiveStudentId: string | null = null;
      try {
        savedActiveStudentId = localStorage.getItem('fitpro_selected_student_id');
      } catch {}

      const activeId =
        savedActiveStudentId && allAlumnos.some((a) => a.id === savedActiveStudentId)
          ? savedActiveStudentId
          : null;

      if (activeId) {
        setSelectedStudentId(activeId);
        const ruts = routinesCacheMap[activeId] || (await getRutinasByAlumno(activeId));
        const ev = await getEvaluacionClinica(activeId);
        setCurrentRutinas(ruts);
        setCurrentEvaluacion(ev);
      } else {
        setSelectedStudentId(null);
        setCurrentRutinas([]);
        setCurrentEvaluacion(null);
      }

      // Restaurar alumnos de sala si estaban activos durante la sesión actual (persiste al recargar F5)
      let savedDockIds: string[] = [];
      try {
        const raw = localStorage.getItem('fitpro_dock_student_ids');
        if (raw) savedDockIds = JSON.parse(raw);
      } catch {}

      if (Array.isArray(savedDockIds) && savedDockIds.length > 0) {
        const restored = savedDockIds
          .map((id) => allAlumnos.find((a) => a.id === id))
          .filter((a): a is Alumno => Boolean(a));
        setActiveDockStudents(restored);
      } else {
        setActiveDockStudents([]);
      }

      isInitialLoadedRef.current = true;
      setLoading(false);
    } catch (err) {
      console.error('Failed to load local DB:', err);
      isInitialLoadedRef.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogin = (user: AuthUser) => {
    isInitialLoadedRef.current = true;
    setCurrentUser(user);
    setActiveView('home');
    setActiveDockStudents([]);
    setSelectedStudentId(null);
    try {
      localStorage.setItem('fitpro_auth_user', JSON.stringify(user));
      localStorage.setItem('fitpro_active_view', 'home');
      localStorage.removeItem('fitpro_selected_student_id');
      localStorage.removeItem('fitpro_dock_student_ids'); // La sala inicia vacía en el nuevo login
    } catch {}
    showToast('success', `Bienvenido, ${user.name}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('home');
    setActiveDockStudents([]);
    setSelectedStudentId(null);
    try {
      localStorage.removeItem('fitpro_auth_user');
      localStorage.removeItem('fitpro_active_view');
      localStorage.removeItem('fitpro_selected_student_id');
      localStorage.removeItem('fitpro_dock_student_ids');
    } catch {}
    showToast('info', 'Sesión cerrada');
  };

  const selectedStudent = alumnos.find((a) => a.id === selectedStudentId) || null;

  const handleSelectStudent = async (alumno: Alumno, view: 'rutina' | 'evaluacion') => {
    setActiveDockStudents((prev) => {
      let updated: Alumno[];
      if (prev.some((a) => a.id === alumno.id)) {
        updated = prev;
      } else if (prev.length < 8) {
        updated = [...prev, alumno];
      } else {
        updated = [...prev.slice(1), alumno];
      }
      try {
        localStorage.setItem('fitpro_dock_student_ids', JSON.stringify(updated.map((a) => a.id)));
      } catch {}
      return updated;
    });

    const cachedRuts = routinesByStudent[alumno.id];
    if (cachedRuts && cachedRuts.length > 0) {
      setCurrentRutinas(cachedRuts);
    }

    try {
      const [ruts, evalClinica] = await Promise.all([
        cachedRuts ? Promise.resolve(cachedRuts) : getRutinasByAlumno(alumno.id),
        getEvaluacionClinica(alumno.id)
      ]);
      setSelectedStudentId(alumno.id);
      setActiveView(view);
      setCurrentRutinas(ruts);
      setCurrentEvaluacion(evalClinica);
      setRoutinesByStudent((prev) => ({ ...prev, [alumno.id]: ruts }));
      try {
        localStorage.setItem('fitpro_selected_student_id', alumno.id);
        localStorage.setItem('fitpro_active_view', view);
      } catch {}
    } catch (err) {
      console.error(err);
      setSelectedStudentId(alumno.id);
      setActiveView(view);
      try {
        localStorage.setItem('fitpro_selected_student_id', alumno.id);
        localStorage.setItem('fitpro_active_view', view);
      } catch {}
    }
  };

  const handleToggleDock = (alumno: Alumno) => {
    setActiveDockStudents((prev) => {
      let updated: Alumno[];
      const isDocked = prev.some((a) => a.id === alumno.id);
      if (isDocked) {
        updated = prev.filter((a) => a.id !== alumno.id);
      } else {
        if (prev.length < 8) {
          updated = [...prev, alumno];
        } else {
          updated = [...prev.slice(1), alumno];
        }
      }
      try {
        localStorage.setItem('fitpro_dock_student_ids', JSON.stringify(updated.map((a) => a.id)));
      } catch {}
      return updated;
    });
  };

  const handleRemoveFromDock = (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDockStudents((prev) => {
      const updated = prev.filter((a) => a.id !== studentId);
      try {
        localStorage.setItem('fitpro_dock_student_ids', JSON.stringify(updated.map((a) => a.id)));
      } catch {}
      return updated;
    });
  };

  const handleCreateNewRoutine = async (alumnoId: string): Promise<Rutina> => {
    const studentRoutines = await getRutinasByAlumno(alumnoId);
    const routineNum = studentRoutines.length + 1;
    const newRoutineId = 'rut-' + alumnoId + '-' + Date.now();
    const newRoutine: Rutina = {
      id: newRoutineId,
      alumno_id: alumnoId,
      nombre_rutina: `Rutina ${routineNum}: Fase Inicial`,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_cambio: new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0],
      activa: true,
      orden: routineNum,
      notas_generales: 'Planificación personalizada.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bloques: [
        {
          id: 'blk-' + alumnoId + '-' + Date.now(),
          rutina_id: newRoutineId,
          nombre_sub_pestana: 'Día 1: Principal',
          orden: 1,
          ejercicios: [
            {
              id: 'ej-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              bloque_id: 'blk-' + alumnoId + '-' + Date.now(),
              orden: 1,
              ejercicio: 'Sentadilla Goblet con Mancuerna',
              series: '3',
              repeticiones: '10',
              carga: '14 kg',
              carga_p2: '16 kg',
              pausa: '60s',
              observaciones_dosificacion: 'Mantener tronco vertical y control excéntrico.'
            }
          ]
        }
      ]
    };

    await saveRutina(newRoutine);
    if (isSupabaseConfigured()) {
      saveRoutineToSupabase(newRoutine).catch((err) => console.warn('[Supabase]', err));
    }

    setRoutinesByStudent((prev) => {
      const list = prev[alumnoId] || [];
      return { ...prev, [alumnoId]: [...list.filter((r) => r.id !== newRoutine.id), newRoutine] };
    });

    setCurrentRutinas((prev) => {
      const filtered = prev.filter((r) => r.id !== newRoutine.id);
      return [...filtered, newRoutine];
    });

    return newRoutine;
  };

  const handleSaveRoutine = async (rutina: Rutina) => {
    isSavingRef.current = true;
    try {
      setRoutinesByStudent((prev) => {
        const list = prev[rutina.alumno_id] || [];
        const idx = list.findIndex((r) => r.id === rutina.id);
        const updated = idx >= 0 ? list.map((r) => (r.id === rutina.id ? rutina : r)) : [...list, rutina];
        return { ...prev, [rutina.alumno_id]: updated };
      });

      setCurrentRutinas((prev) => {
        const idx = prev.findIndex((r) => r.id === rutina.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = rutina;
          return copy;
        }
        return [...prev, rutina];
      });

      await saveRutina(rutina);

      if (isSupabaseConfigured()) {
        saveRoutineToSupabase(rutina).catch((err) => console.warn('[Supabase]', err));
      }
    } finally {
      setTimeout(() => {
        isSavingRef.current = false;
      }, 500);
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    await deleteRutina(routineId);
    if (isSupabaseConfigured()) {
      deleteRoutineFromSupabase(routineId).catch((err) => console.warn('[Supabase]', err));
    }
    setRoutinesByStudent((prev) => {
      const copy: Record<string, Rutina[]> = {};
      for (const [k, v] of Object.entries(prev)) {
        copy[k] = v.filter((r) => r.id !== routineId);
      }
      return copy;
    });
    setCurrentRutinas((prev) => prev.filter((r) => r.id !== routineId));
  };

  const handleSaveEvaluacion = async (evaluacion: EvaluacionClinica) => {
    await saveEvaluacionClinica(evaluacion);
    setCurrentEvaluacion(evaluacion);
  };

  const handleAddStudent = async (newAlumno: Omit<Alumno, 'id' | 'created_at' | 'updated_at'>) => {
    const created: Alumno = {
      ...newAlumno,
      id: 'alm-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await saveAlumno(created);

    if (isSupabaseConfigured()) {
      const res = await saveStudentToSupabase(created);
      if (res.success) {
        showToast('success', `✓ Alumno "${created.nombre} ${created.apellido}" guardado`);
      } else {
        showToast('error', `⚠️ Guardado localmente, error nube: ${res.error || 'Error'}`);
      }
    } else {
      showToast('success', `Alumno guardado en este dispositivo`);
    }

    const newRoutine = await handleCreateNewRoutine(created.id);
    setRoutinesByStudent((prev) => ({ ...prev, [created.id]: [newRoutine] }));
    setCurrentRutinas([newRoutine]);
    setAlumnos((prev) => [...prev, created]);
    setSelectedStudentId(created.id);
    setActiveDockStudents((prev) => [created, ...prev.slice(0, 7)]);
  };

  const handleEditStudent = async (updatedAlumno: Alumno) => {
    await saveAlumno(updatedAlumno);
    setAlumnos((prev) => prev.map((a) => (a.id === updatedAlumno.id ? updatedAlumno : a)));
    setActiveDockStudents((prev) => prev.map((a) => (a.id === updatedAlumno.id ? updatedAlumno : a)));

    if (isSupabaseConfigured()) {
      const res = await saveStudentToSupabase(updatedAlumno);
      if (res.success) {
        showToast('success', `✓ Alumno "${updatedAlumno.nombre}" actualizado`);
      } else {
        showToast('error', `⚠️ Error en Supabase: ${res.error || 'Error'}`);
      }
    } else {
      showToast('success', `✓ Datos del alumno actualizados`);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    setAlumnos((prev) => prev.filter((a) => a.id !== studentId));
    setActiveDockStudents((prev) => prev.filter((a) => a.id !== studentId));
    setRoutinesByStudent((prev) => {
      const copy = { ...prev };
      delete copy[studentId];
      return copy;
    });
    setStudentActiveDays((prev) => {
      const copy = { ...prev };
      delete copy[studentId];
      return copy;
    });
    setStudentActiveRoutines((prev) => {
      const copy = { ...prev };
      delete copy[studentId];
      return copy;
    });

    if (selectedStudentId === studentId) {
      setSelectedStudentId((prev) => {
        const remaining = alumnos.filter((a) => a.id !== studentId);
        return remaining[0]?.id || null;
      });
    }

    if (isSupabaseConfigured()) {
      await deleteStudentFromSupabase(studentId);
    }

    await deleteAlumno(studentId);
  };

  const handleClearAllStudents = async () => {
    setAlumnos([]);
    setActiveDockStudents([]);
    setSelectedStudentId(null);
    setCurrentRutinas([]);
    setCurrentEvaluacion(null);
    setRoutinesByStudent({});
    setStudentActiveDays({});
    setStudentActiveRoutines({});
    try {
      localStorage.removeItem('fitpro_dock_student_ids');
      localStorage.removeItem('fitpro_selected_student_id');
    } catch {}

    if (isSupabaseConfigured()) {
      await clearAllStudentsFromSupabase();
    }

    await clearAllLocalAlumnos();
  };

  const handleAddGrupo = async (newGrupo: Omit<Grupo, 'id'>) => {
    const created: Grupo = {
      ...newGrupo,
      id: 'grp-' + Date.now()
    };
    await saveGrupo(created);
    if (isSupabaseConfigured()) {
      saveGroupToSupabase(created).catch((err) => console.warn('[Supabase]', err));
    }
    await loadData();
  };

  const handleEditGrupo = async (updatedGrupo: Grupo) => {
    await saveGrupo(updatedGrupo);
    if (isSupabaseConfigured()) {
      saveGroupToSupabase(updatedGrupo).catch((err) => console.warn('[Supabase]', err));
    }
    await loadData();
  };

  const handleDeleteGrupo = async (grupoId: string) => {
    await deleteGrupo(grupoId);
    if (isSupabaseConfigured()) {
      deleteGroupFromSupabase(grupoId).catch((err) => console.warn('[Supabase]', err));
    }
    await loadData();
  };

  const handleReassignStudentGroup = async (alumnoId: string, newGrupoId: string) => {
    const target = alumnos.find((a) => a.id === alumnoId);
    if (target) {
      const updated = {
        ...target,
        grupo_id: newGrupoId,
        updated_at: new Date().toISOString()
      };
      await saveAlumno(updated);
      setAlumnos((prev) => prev.map((a) => (a.id === alumnoId ? updated : a)));
    }
  };

  const handleSavePayment = async (pagoData: Omit<PagoCuota, 'id' | 'created_at'>) => {
    try {
      const newPago: PagoCuota = {
        ...pagoData,
        id: `pago-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        created_at: new Date().toISOString(),
      };

      setPagos((prev) => {
        const updated = [newPago, ...prev.filter((p) => p.id !== newPago.id)];
        try {
          localStorage.setItem('fitpro_local_pagos', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      const target = alumnos.find((a) => a.id === pagoData.alumno_id);
      if (target) {
        const updatedAlumno: Alumno = {
          ...target,
          fecha_pago_cuota: pagoData.fecha_pago,
          fecha_vencimiento_cuota: pagoData.fecha_vencimiento,
          cuota_al_dia: true,
          ultimo_monto_pago: pagoData.monto,
          updated_at: new Date().toISOString(),
        };
        await handleEditStudent(updatedAlumno);
      }

      showToast('success', `Pago de $${pagoData.monto} registrado exitosamente`);
    } catch (err) {
      console.error('Error registrando pago:', err);
      showToast('error', 'Error al registrar el pago');
    }
  };

  const handleDeletePayment = async (pagoId: string) => {
    setPagos((prev) => {
      const updated = prev.filter((p) => p.id !== pagoId);
      try {
        localStorage.setItem('fitpro_local_pagos', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('info', 'Pago anulado correctamente');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-display font-bold text-white text-base">Iniciando FitPro Manager...</p>
          <span className="text-xs text-slate-500 font-mono">Cargando base de datos local</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} defaultEmail="jonalippo@gmail.com" />;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        userName={currentUser.name}
        onLogout={handleLogout}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-5 pb-24 overflow-x-hidden">
        {/* Mobile quick tabs */}
        <div className="md:hidden flex items-center gap-1.5 mb-4 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs shadow-sm">
          <button
            onClick={() => setActiveView('home')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeView === 'home' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </button>
          <button
            onClick={() => setActiveView('alumnos')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeView === 'alumnos' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Alumnos</span>
          </button>
          <button
            onClick={() => setActiveView('grupos')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeView === 'grupos' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Grupos</span>
          </button>
          <button
            onClick={() => setActiveView('pagos')}
            className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
              activeView === 'pagos' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Pagos</span>
          </button>
        </div>

        {/* View 0: Dashboard Home */}
        {activeView === 'home' && (
          <DashboardHome
            alumnos={alumnos}
            grupos={grupos}
            pagos={pagos}
            userName={currentUser.name}
            onNavigate={(view) => setActiveView(view)}
            onSelectStudent={(alm, view) => handleSelectStudent(alm, view)}
          />
        )}

        {/* View 1: Alumnos Directory */}
        {activeView === 'alumnos' && (
          <StudentList
            alumnos={alumnos}
            grupos={grupos}
            selectedStudentId={selectedStudentId}
            activeDockIds={activeDockStudents.map((a) => a.id)}
            onSelectStudent={(alm, view) => handleSelectStudent(alm, view)}
            onToggleDockStudent={handleToggleDock}
            onOpenDailyLog={(alm) => {
              setDailyLogStudent(alm);
              setIsDailyLogOpen(true);
            }}
            onAddStudent={handleAddStudent}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onAddGrupo={handleAddGrupo}
            onClearAllStudents={handleClearAllStudents}
            onNavigateToGroups={() => setActiveView('grupos')}
          />
        )}

        {/* View 2: Grupos & Turnos */}
        {activeView === 'grupos' && (
          <GroupManager
            grupos={grupos}
            alumnos={alumnos}
            onAddGrupo={handleAddGrupo}
            onEditGrupo={handleEditGrupo}
            onDeleteGrupo={handleDeleteGrupo}
            onReassignStudentGroup={handleReassignStudentGroup}
            onSelectStudent={(alm, view) => handleSelectStudent(alm, view)}
            onBackToAlumnos={() => setActiveView('alumnos')}
          />
        )}

        {/* View 3: Rutina Interactive Spreadsheet */}
        {activeView === 'rutina' && !selectedStudent && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
            <Users className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-white mb-1">Ningún alumno seleccionado</h3>
            <p className="text-xs text-slate-400 mb-5">
              Para ver o planificar una rutina, selecciona un alumno desde la lista o súmalo a la sala activa.
            </p>
            <button
              onClick={() => setActiveView('alumnos')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
            >
              Ir a Lista de Alumnos
            </button>
          </div>
        )}

        {activeView === 'rutina' && selectedStudent && (
          <RoutineSpreadsheet
            key={selectedStudent.id}
            alumno={selectedStudent}
            rutinas={
              routinesByStudent[selectedStudent.id] ||
              currentRutinas.filter((r) => String(r.alumno_id) === String(selectedStudent.id))
            }
            evaluacion={currentEvaluacion}
            allAlumnos={alumnos}
            savedActiveBlockId={studentActiveDays[selectedStudent.id]}
            onActiveBlockChange={(blockId) =>
              setStudentActiveDays((prev) => ({ ...prev, [selectedStudent.id]: blockId }))
            }
            savedActiveRoutineId={studentActiveRoutines[selectedStudent.id]}
            onActiveRoutineChange={(routineId) =>
              setStudentActiveRoutines((prev) => ({ ...prev, [selectedStudent.id]: routineId }))
            }
            onSaveRoutine={handleSaveRoutine}
            onCreateNewRoutine={handleCreateNewRoutine}
            onDeleteRoutine={handleDeleteRoutine}
            onBackToAlumnos={() => setActiveView('alumnos')}
            onSwitchStudent={(alm) => handleSelectStudent(alm, 'rutina')}
            onOpenEvaluation={() => setActiveView('evaluacion')}
          />
        )}

        {/* View 4: Evaluación Clínica */}
        {activeView === 'evaluacion' && !selectedStudent && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
            <Activity className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-white mb-1">Ningún alumno seleccionado</h3>
            <p className="text-xs text-slate-400 mb-5">
              Para registrar una evaluación clínica, selecciona un alumno desde el directorio.
            </p>
            <button
              onClick={() => setActiveView('alumnos')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
            >
              Ir a Lista de Alumnos
            </button>
          </div>
        )}

        {activeView === 'evaluacion' && selectedStudent && (
          <div className="space-y-4 pb-24">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 px-3.5 py-2.5 rounded-2xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveView('alumnos')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 text-xs font-bold transition group shadow-sm active:scale-95"
                  title="Volver a la lista de todos los alumnos"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
                  <span>Volver a Alumnos</span>
                </button>

                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                  <button onClick={() => setActiveView('alumnos')} className="hover:text-slate-200 transition">
                    Alumnos
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="font-semibold text-white">
                    {selectedStudent.nombre} {selectedStudent.apellido}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-emerald-400 font-medium">Evaluación Clínica</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {alumnos.length > 1 && (
                  <select
                    value={selectedStudent.id}
                    onChange={(e) => {
                      const target = alumnos.find((a) => a.id === e.target.value);
                      if (target) handleSelectStudent(target, 'evaluacion');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    {alumnos.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre} {a.apellido} {a.alerta_lesion_activa ? '⚠️' : ''}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => setActiveView('rutina')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>Ver Rutina</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-emerald-400 font-bold text-lg flex items-center justify-center border border-emerald-500/30">
                  {selectedStudent.nombre.charAt(0)}{selectedStudent.apellido.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {selectedStudent.nombre} {selectedStudent.apellido}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Historial biopsicosocial y evaluación física según Demanda vs. Capacidad.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEvalModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm active:scale-95"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Editar Evaluación (5 Pilares)</span>
              </button>
            </div>

            {currentEvaluacion ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>Presentación Actual & Conducta</span>
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-amber-400 font-bold border border-slate-800">
                      EVA: {currentEvaluacion.dolor_eva}/10
                    </span>
                  </div>
                  <p><strong className="text-slate-300">Objetivos:</strong> {currentEvaluacion.objetivos_principales}</p>
                  <p><strong className="text-slate-300">Síntomas:</strong> {currentEvaluacion.sintomas_relevantes}</p>
                  <p><strong className="text-slate-300">Zonas Afectadas:</strong> {currentEvaluacion.zonas_dolor.join(', ')}</p>
                  <p><strong className="text-slate-300">Decisión Clínica:</strong> <span className="font-bold text-emerald-400">{currentEvaluacion.decision_conducta}</span></p>
                  <p><strong className="text-slate-300">Justificación:</strong> {currentEvaluacion.justificacion_clinica}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-blue-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Brain className="w-4 h-4" />
                      <span>Capacidad Física & Biopsicosocial</span>
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      Tolerancia: {currentEvaluacion.tolerancia_carga_estimada}
                    </span>
                  </div>
                  <p><strong className="text-slate-300">Lesiones Previas:</strong> {currentEvaluacion.lesiones_previas}</p>
                  <p><strong className="text-slate-300">Movilidad Articular:</strong> {currentEvaluacion.movilidad_articular}</p>
                  <p><strong className="text-slate-300">Sueño & Estrés:</strong> Sueño {currentEvaluacion.calidad_sueno}/5 · Estrés {currentEvaluacion.nivel_estres}/10</p>
                  <p><strong className="text-slate-300">Kinesiofobia:</strong> {currentEvaluacion.kinesiofobia_nivel}</p>
                  <p><strong className="text-slate-300">Barreras / Adherencia:</strong> {currentEvaluacion.expectativas_barreras}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 p-6 rounded-2xl bg-slate-900 border border-dashed border-slate-800 shadow-md">
                <p className="text-sm font-semibold text-slate-300">No se ha cargado la evaluación clínica aún</p>
                <button
                  onClick={() => setIsEvalModalOpen(true)}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
                >
                  Cargar Evaluación Ahora
                </button>
              </div>
            )}
          </div>
        )}

        {/* View 5: Pantalla de Pagos */}
        {activeView === 'pagos' && (
          <PaymentsManager
            alumnos={alumnos}
            grupos={grupos}
            pagos={pagos}
            onSavePayment={handleSavePayment}
            onDeletePayment={handleDeletePayment}
          />
        )}
      </main>

      {/* Modo Sala: Fixed Bottom Dock */}
      <BottomDock
        activeStudents={activeDockStudents}
        selectedStudentId={selectedStudentId}
        onSelectStudent={(alm) => {
          handleSelectStudent(alm, 'rutina');
        }}
        onRemoveFromDock={handleRemoveFromDock}
        onOpenStudentDirectory={() => setActiveView('alumnos')}
      />

      {/* Daily Session Log Modal (RPE & EVA) */}
      {dailyLogStudent && (
        <DailyTrackingModal
          alumno={dailyLogStudent}
          isOpen={isDailyLogOpen}
          onClose={() => {
            setIsDailyLogOpen(false);
            setDailyLogStudent(null);
          }}
          onSessionLogged={() => {
            loadData();
          }}
        />
      )}

      {/* Clinical 5-Pillar Modal */}
      {selectedStudent && isEvalModalOpen && (
        <ClinicalEvaluationModal
          alumno={selectedStudent}
          evaluacionActual={currentEvaluacion}
          isOpen={isEvalModalOpen}
          onClose={() => setIsEvalModalOpen(false)}
          onSaveEvaluacion={async (evalData: EvaluacionClinica) => {
            await handleSaveEvaluacion(evalData);
            setIsEvalModalOpen(false);
            showToast('success', 'Evaluación guardada');
          }}
        />
      )}

      {/* Supabase SQL Config Modal */}
      {isSupabaseModalOpen && (
        <SupabaseSqlModal
          isOpen={isSupabaseModalOpen}
          onClose={() => {
            setIsSupabaseModalOpen(false);
            setIsCloudConnected(isSupabaseConfigured());
          }}
        />
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-slate-800 text-white text-xs font-semibold shadow-2xl backdrop-blur animate-in slide-in-from-bottom-2">
          <span
            className={`w-2 h-2 rounded-full ${
              toastMessage.type === 'success'
                ? 'bg-emerald-400'
                : toastMessage.type === 'error'
                ? 'bg-rose-400'
                : toastMessage.type === 'warning'
                ? 'bg-amber-400'
                : 'bg-blue-400'
            }`}
          />
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}