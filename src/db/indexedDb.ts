import {
  Alumno,
  Grupo,
  Rutina,
  EvaluacionClinica,
  SeguimientoDiario,
  Organizacion,
  Profesor,
  PagoCuota,
  SyncStatus
} from '../types';

const DB_NAME = 'FitProManagerDB';
const DB_VERSION = 5;

export const STORES = {
  ORGANIZACIONES: 'organizaciones',
  PROFESORES: 'profesores',
  GRUPOS: 'grupos',
  ALUMNOS: 'alumnos',
  EVALUACIONES: 'evaluaciones_clinicas',
  SEGUIMIENTO: 'seguimiento_diario',
  RUTINAS: 'rutinas',
  SYNC_QUEUE: 'sync_queue',
  PAGOS: 'pagos'
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('organizaciones')) {
        db.createObjectStore('organizaciones', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('profesores')) {
        const store = db.createObjectStore('profesores', { keyPath: 'id' });
        store.createIndex('auth_user_id', 'auth_user_id', { unique: true });
      }

      if (!db.objectStoreNames.contains('grupos')) {
        const store = db.createObjectStore('grupos', { keyPath: 'id' });
        store.createIndex('organizacion_id', 'organizacion_id', { unique: false });
        store.createIndex('profesor_id', 'profesor_id', { unique: false });
      }

      if (!db.objectStoreNames.contains('alumnos')) {
        const store = db.createObjectStore('alumnos', { keyPath: 'id' });
        store.createIndex('grupo_id', 'grupo_id', { unique: false });
        store.createIndex('organizacion_id', 'organizacion_id', { unique: false });
        store.createIndex('profesor_id', 'profesor_id', { unique: false });
        store.createIndex('estado_activo', 'estado_activo', { unique: false });
      }

      if (!db.objectStoreNames.contains('evaluaciones_clinicas')) {
        const store = db.createObjectStore('evaluaciones_clinicas', { keyPath: 'id' });
        store.createIndex('alumno_id', 'alumno_id', { unique: false });
        store.createIndex('fecha', 'fecha', { unique: false });
      }

      if (!db.objectStoreNames.contains('seguimiento_diario')) {
        const store = db.createObjectStore('seguimiento_diario', { keyPath: 'id' });
        store.createIndex('alumno_id', 'alumno_id', { unique: false });
        store.createIndex('fecha', 'fecha', { unique: false });
      }

      if (!db.objectStoreNames.contains('rutinas')) {
        const store = db.createObjectStore('rutinas', { keyPath: 'id' });
        store.createIndex('alumno_id', 'alumno_id', { unique: false });
        store.createIndex('activa', 'activa', { unique: false });
      }

      if (!db.objectStoreNames.contains('sync_queue')) {
        const store = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains('pagos')) {
        const store = db.createObjectStore('pagos', { keyPath: 'id' });
        store.createIndex('alumno_id', 'alumno_id', { unique: false });
        store.createIndex('mes_correspondiente', 'mes_correspondiente', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function seedInitialDataIfEmpty(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('grupos', 'readonly');
  const gruposStore = tx.objectStore('grupos');
  const countReq = gruposStore.count();

  const count = await new Promise<number>((res) => {
    countReq.onsuccess = () => res(countReq.result);
    countReq.onerror = () => res(0);
  });

  if (count > 0) return;

  const writeTx = db.transaction(
    ['organizaciones', 'profesores', 'grupos'],
    'readwrite'
  );

  const org: Organizacion = {
    id: 'org-1',
    nombre: 'Centro de Entrenamiento & Salud',
    plan_suscripcion: 'pro',
    max_profesores: 8,
    created_at: new Date().toISOString()
  };

  const prof1: Profesor = {
    id: 'prof-1',
    auth_user_id: 'auth-user-admin',
    organizacion_id: 'org-1',
    rol: 'admin_gimnasio',
    nombre: 'Profesor Principal',
    email: 'entrenador@gymfit.com'
  };

  const grupos: Grupo[] = [
    {
      id: 'grp-1',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      nombre_grupo: 'Turno Mañana',
      horario: '08:00 - 10:00 hs',
      descripcion: 'Entrenamiento general y readaptación.'
    },
    {
      id: 'grp-2',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      nombre_grupo: 'Turno Tarde',
      horario: '16:00 - 18:00 hs',
      descripcion: 'Fuerza, hipertrofia y acondicionamiento.'
    },
    {
      id: 'grp-3',
      profesor_id: 'prof-1',
      organizacion_id: 'org-1',
      nombre_grupo: 'Turno Noche',
      horario: '19:00 - 21:00 hs',
      descripcion: 'Potencia y rendimiento físico.'
    }
  ];

  writeTx.objectStore('organizaciones').put(org);
  writeTx.objectStore('profesores').put(prof1);
  grupos.forEach((g) => writeTx.objectStore('grupos').put(g));

  return new Promise<void>((resolve, reject) => {
    writeTx.oncomplete = () => resolve();
    writeTx.onerror = () => reject(writeTx.error);
  });
}

export async function clearAllLocalAlumnos(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['alumnos', 'evaluaciones_clinicas', 'rutinas', 'seguimiento_diario'], 'readwrite');
  tx.objectStore('alumnos').clear();
  tx.objectStore('evaluaciones_clinicas').clear();
  tx.objectStore('rutinas').clear();
  tx.objectStore('seguimiento_diario').clear();

  // Limpiar también copias locales de respaldo
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('fitpro_routine_backup_') || k.startsWith('fitpro_student_routines_')) {
        localStorage.removeItem(k);
      }
    });
  } catch {}

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

type DBListener = () => void;
const listeners: Set<DBListener> = new Set();

export function subscribeToDBChanges(listener: DBListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyDBChanged() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      console.error('Error in DB listener:', e);
    }
  });
}

export async function getAlumnos(): Promise<Alumno[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('alumnos', 'readonly');
    const store = tx.objectStore('alumnos');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAlumno(alumno: Alumno): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['alumnos', 'sync_queue'], 'readwrite');
  alumno.updated_at = new Date().toISOString();
  tx.objectStore('alumnos').put(alumno);
  tx.objectStore('sync_queue').add({
    table: 'alumnos',
    action: 'upsert',
    record_id: alumno.id,
    timestamp: new Date().toISOString(),
    payload: alumno
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getGrupos(): Promise<Grupo[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('grupos', 'readonly');
    const store = tx.objectStore('grupos');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function saveGrupo(grupo: Grupo): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('grupos', 'readwrite');
  tx.objectStore('grupos').put(grupo);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteGrupo(grupoId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['grupos', 'alumnos'], 'readwrite');
  tx.objectStore('grupos').delete(grupoId);

  const alumnosStore = tx.objectStore('alumnos');
  const index = alumnosStore.index('grupo_id');
  const req = index.getAll(grupoId);

  req.onsuccess = () => {
    const alumnos = req.result as Alumno[];
    alumnos.forEach((alm) => {
      if (alm.grupo_id === grupoId) {
        alm.grupo_id = '';
        alumnosStore.put(alm);
      }
    });
  };

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export function sortRoutineBloquesAndEjercicios(rutina: Rutina): Rutina {
  if (!rutina) return rutina;
  const sortedBloques = Array.isArray(rutina.bloques)
    ? [...rutina.bloques]
        .sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0))
        .map((b) => ({
          ...b,
          ejercicios: Array.isArray(b.ejercicios)
            ? [...b.ejercicios]
                .sort((x, y) => (Number(x.orden) || 0) - (Number(y.orden) || 0))
                .map((ej) => {
                  const isSep = Boolean(
                    ej.es_separador ||
                    (typeof ej.ejercicio === 'string' && (ej.ejercicio.includes('SEPARADOR') || ej.ejercicio.startsWith('—')))
                  );
                  let sub = (ej.subtitulo_bloque || '').trim();
                  if (isSep && !sub && ej.ejercicio) {
                    const match = String(ej.ejercicio).match(/^—\s*SEPARADOR(?::\s*(.*?))?\s*—$/i);
                    if (match && match[1]) {
                      sub = match[1].trim();
                    } else if (ej.ejercicio !== '— SEPARADOR —' && ej.ejercicio !== '— SEPARADOR DE BLOQUE —') {
                      sub = String(ej.ejercicio).replace(/^—+\s*/, '').replace(/\s*—+$/, '').replace(/^SEPARADOR:\s*/i, '').trim();
                    }
                  }
                  return {
                    ...ej,
                    id: String(ej.id),
                    bloque_id: String(ej.bloque_id || b.id),
                    orden: Number(ej.orden) || 1,
                    ejercicio: isSep ? (sub ? `— SEPARADOR: ${sub} —` : '— SEPARADOR DE BLOQUE —') : (ej.ejercicio || ''),
                    series: isSep ? '' : (ej.series ? String(ej.series) : ''),
                    repeticiones: isSep ? '' : (ej.repeticiones ? String(ej.repeticiones) : ''),
                    carga: isSep ? '' : (ej.carga ? String(ej.carga) : ''),
                    carga_p2: isSep ? '' : (ej.carga_p2 ? String(ej.carga_p2) : ''),
                    pausa: isSep ? '' : (ej.pausa ? String(ej.pausa) : ''),
                    observaciones_dosificacion: isSep ? '' : (ej.observaciones_dosificacion ? String(ej.observaciones_dosificacion) : ''),
                    video_url: isSep ? '' : (ej.video_url ? String(ej.video_url) : ''),
                    es_separador: isSep,
                    subtitulo_bloque: sub
                  };
                })
            : []
        }))
    : [];
  return { ...rutina, bloques: sortedBloques };
}

// Respaldo en localStorage para que NUNCA se pierdan las rutinas al recargar
function backupRoutinesToLocalStorage(alumnoId: string, routines: Rutina[]) {
  try {
    localStorage.setItem(`fitpro_student_routines_${alumnoId}`, JSON.stringify(routines));
  } catch {}
}

function getRoutinesFromLocalStorageBackup(alumnoId: string): Rutina[] {
  try {
    const saved = localStorage.getItem(`fitpro_student_routines_${alumnoId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sortRoutineBloquesAndEjercicios);
      }
    }
  } catch {}
  return [];
}

export async function getRutinasByAlumno(alumnoId: string): Promise<Rutina[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('rutinas', 'readonly');
      const store = tx.objectStore('rutinas');
      const req = store.getAll();

      req.onsuccess = () => {
        const allRoutines = (req.result || []) as Rutina[];
        const filtered = allRoutines.filter((r) => String(r.alumno_id).trim() === String(alumnoId).trim());
        const backup = getRoutinesFromLocalStorageBackup(alumnoId);

        let merged: Rutina[] = [];
        if (filtered.length > 0) {
          const results = filtered.map(sortRoutineBloquesAndEjercicios);
          // Si el respaldo de localStorage tiene rutinas o bloques con más ejercicios, protegerlos
          merged = results.map((r) => {
            const bMatch = backup.find((b) => b.id === r.id);
            if (bMatch) {
              const rEjs = r.bloques?.reduce((acc, blk) => acc + (blk.ejercicios?.length || 0), 0) || 0;
              const bEjs = bMatch.bloques?.reduce((acc, blk) => acc + (blk.ejercicios?.length || 0), 0) || 0;
              if (bEjs > rEjs) {
                return bMatch;
              }
            }
            return r;
          });

          // Agregar rutinas que existan en el backup pero no en IndexedDB
          backup.forEach((b) => {
            if (!merged.some((m) => m.id === b.id)) {
              merged.push(b);
            }
          });
        } else {
          merged = backup;
        }

        merged.sort((a, b) => (b.activa ? 1 : 0) - (a.activa ? 1 : 0));
        if (merged.length > 0) {
          backupRoutinesToLocalStorage(alumnoId, merged);
        }
        resolve(merged);
      };

      req.onerror = () => {
        const backup = getRoutinesFromLocalStorageBackup(alumnoId);
        resolve(backup);
      };
    } catch {
      const backup = getRoutinesFromLocalStorageBackup(alumnoId);
      resolve(backup);
    }
  });
}

export async function getAllRutinas(): Promise<Rutina[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rutinas', 'readonly');
    const store = tx.objectStore('rutinas');
    const req = store.getAll();
    req.onsuccess = () => {
      const results = ((req.result || []) as Rutina[]).map(sortRoutineBloquesAndEjercicios);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveRutina(rutina: Rutina): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['rutinas', 'sync_queue'], 'readwrite');
  const normalizedRutina = sortRoutineBloquesAndEjercicios({
    ...rutina,
    updated_at: new Date().toISOString()
  });

  tx.objectStore('rutinas').put(normalizedRutina);
  tx.objectStore('sync_queue').add({
    table: 'rutinas',
    action: 'upsert',
    record_id: normalizedRutina.id,
    timestamp: new Date().toISOString(),
    payload: normalizedRutina
  });

  // Guardar inmediatamente en respaldo de localStorage
  try {
    const currentBackup = getRoutinesFromLocalStorageBackup(rutina.alumno_id);
    const existingIdx = currentBackup.findIndex((r) => r.id === normalizedRutina.id);
    let updatedBackup: Rutina[];
    if (existingIdx >= 0) {
      updatedBackup = currentBackup.map((r) => (r.id === normalizedRutina.id ? normalizedRutina : r));
    } else {
      updatedBackup = [...currentBackup, normalizedRutina];
    }
    backupRoutinesToLocalStorage(rutina.alumno_id, updatedBackup);
  } catch {}

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getEvaluacionClinica(alumnoId: string): Promise<EvaluacionClinica | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('evaluaciones_clinicas', 'readonly');
    const store = tx.objectStore('evaluaciones_clinicas');
    const index = store.index('alumno_id');
    const req = index.getAll(alumnoId);
    req.onsuccess = () => {
      const items = req.result || [];
      if (items.length > 0) {
        items.sort((a: EvaluacionClinica, b: EvaluacionClinica) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        resolve(items[0]);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveEvaluacionClinica(evaluacion: EvaluacionClinica): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['evaluaciones_clinicas', 'alumnos', 'sync_queue'], 'readwrite');
  tx.objectStore('evaluaciones_clinicas').put(evaluacion);

  const alumnoReq = tx.objectStore('alumnos').get(evaluacion.alumno_id);
  alumnoReq.onsuccess = () => {
    const alumno = alumnoReq.result as Alumno | undefined;
    if (alumno) {
      alumno.dolor_eva_actual = evaluacion.dolor_eva;
      alumno.zona_dolor_principal = evaluacion.zonas_dolor[0];
      alumno.decision_actual = evaluacion.decision_conducta;
      if (evaluacion.alertas_biomecanicas_clave.length > 0) {
        alumno.alerta_lesion_activa = evaluacion.alertas_biomecanicas_clave[0];
      }
      alumno.updated_at = new Date().toISOString();
      tx.objectStore('alumnos').put(alumno);
    }
  };

  tx.objectStore('sync_queue').add({
    table: 'evaluaciones_clinicas',
    action: 'upsert',
    record_id: evaluacion.id,
    timestamp: new Date().toISOString(),
    payload: evaluacion
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSeguimientoDiario(alumnoId: string): Promise<SeguimientoDiario[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('seguimiento_diario', 'readonly');
    const store = tx.objectStore('seguimiento_diario');
    const index = store.index('alumno_id');
    const req = index.getAll(alumnoId);
    req.onsuccess = () => {
      const items = (req.result || []) as SeguimientoDiario[];
      items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveSeguimientoDiario(seg: SeguimientoDiario): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['seguimiento_diario', 'alumnos', 'sync_queue'], 'readwrite');
  tx.objectStore('seguimiento_diario').put(seg);

  const alumnoReq = tx.objectStore('alumnos').get(seg.alumno_id);
  alumnoReq.onsuccess = () => {
    const alumno = alumnoReq.result as Alumno | undefined;
    if (alumno) {
      alumno.dolor_eva_actual = seg.nivel_dolor;
      alumno.updated_at = new Date().toISOString();
      tx.objectStore('alumnos').put(alumno);
    }
  };

  tx.objectStore('sync_queue').add({
    table: 'seguimiento_diario',
    action: 'insert',
    record_id: seg.id,
    timestamp: new Date().toISOString(),
    payload: seg
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteAlumno(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['alumnos', 'rutinas', 'evaluaciones_clinicas', 'seguimiento_diario', 'sync_queue'], 'readwrite');
  tx.objectStore('alumnos').delete(id);

  const rutStore = tx.objectStore('rutinas');
  const rutIndex = rutStore.index('alumno_id');
  const rutReq = rutIndex.getAll(id);
  rutReq.onsuccess = () => {
    (rutReq.result || []).forEach((r: Rutina) => rutStore.delete(r.id));
  };

  const evalStore = tx.objectStore('evaluaciones_clinicas');
  const evalIndex = evalStore.index('alumno_id');
  const evalReq = evalIndex.getAll(id);
  evalReq.onsuccess = () => {
    (evalReq.result || []).forEach((e: EvaluacionClinica) => evalStore.delete(e.id));
  };

  const segStore = tx.objectStore('seguimiento_diario');
  const segIndex = segStore.index('alumno_id');
  const segReq = segIndex.getAll(id);
  segReq.onsuccess = () => {
    (segReq.result || []).forEach((s: SeguimientoDiario) => segStore.delete(s.id));
  };

  tx.objectStore('sync_queue').add({
    table: 'alumnos',
    action: 'delete',
    record_id: id,
    timestamp: new Date().toISOString()
  });

  try {
    localStorage.removeItem(`fitpro_student_routines_${id}`);
    localStorage.removeItem(`fitpro_active_routine_${id}`);
    localStorage.removeItem(`fitpro_active_block_${id}`);
  } catch {}

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteRutina(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['rutinas', 'sync_queue'], 'readwrite');
  tx.objectStore('rutinas').delete(id);
  tx.objectStore('sync_queue').add({
    table: 'rutinas',
    action: 'delete',
    record_id: id,
    timestamp: new Date().toISOString()
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      notifyDBChanged();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSyncQueue(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingMutationsCount(): Promise<number> {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains('sync_queue')) return 0;
    return new Promise((resolve) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

export async function clearSyncQueue(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('sync_queue', 'readwrite');
  tx.objectStore('sync_queue').clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPagos(): Promise<PagoCuota[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      if (!db.objectStoreNames.contains('pagos')) {
        const local = localStorage.getItem('fitpro_local_pagos');
        resolve(local ? JSON.parse(local) : []);
        return;
      }
      const tx = db.transaction('pagos', 'readonly');
      const store = tx.objectStore('pagos');
      const req = store.getAll();
      req.onsuccess = () => {
        const list: PagoCuota[] = req.result || [];
        list.sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());
        resolve(list);
      };
      req.onerror = () => {
        const local = localStorage.getItem('fitpro_local_pagos');
        resolve(local ? JSON.parse(local) : []);
      };
    });
  } catch (err) {
    console.warn('Error reading pagos:', err);
    const local = localStorage.getItem('fitpro_local_pagos');
    return local ? JSON.parse(local) : [];
  }
}

export async function savePago(pago: PagoCuota): Promise<void> {
  try {
    try {
      const saved = localStorage.getItem('fitpro_local_pagos');
      const list: PagoCuota[] = saved ? JSON.parse(saved) : [];
      const idx = list.findIndex((p) => p.id === pago.id);
      if (idx >= 0) list[idx] = pago;
      else list.unshift(pago);
      localStorage.setItem('fitpro_local_pagos', JSON.stringify(list));
    } catch {}

    const db = await openDB();
    if (!db.objectStoreNames.contains('pagos')) {
      notifyDBChanged();
      return;
    }
    const tx = db.transaction(['pagos', 'sync_queue'], 'readwrite');
    tx.objectStore('pagos').put(pago);
    tx.objectStore('sync_queue').add({
      table: 'pagos',
      action: 'upsert',
      record_id: pago.id,
      timestamp: new Date().toISOString(),
      payload: pago
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        notifyDBChanged();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error in savePago IndexedDB, saved to localStorage backup:', err);
    notifyDBChanged();
  }
}

export async function deletePago(id: string): Promise<void> {
  try {
    try {
      const saved = localStorage.getItem('fitpro_local_pagos');
      if (saved) {
        const list: PagoCuota[] = JSON.parse(saved);
        localStorage.setItem('fitpro_local_pagos', JSON.stringify(list.filter((p) => p.id !== id)));
      }
    } catch {}

    const db = await openDB();
    if (!db.objectStoreNames.contains('pagos')) {
      notifyDBChanged();
      return;
    }
    const tx = db.transaction(['pagos', 'sync_queue'], 'readwrite');
    tx.objectStore('pagos').delete(id);
    tx.objectStore('sync_queue').add({
      table: 'pagos',
      action: 'delete',
      record_id: id,
      timestamp: new Date().toISOString()
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        notifyDBChanged();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error in deletePago:', err);
    notifyDBChanged();
  }
}