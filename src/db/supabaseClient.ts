import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Alumno, Grupo, Rutina, EvaluacionClinica, SeguimientoDiario, BloqueRutina, EjercicioRutina, PagoCuota } from '../types';

// ============================================================================
// CREDENTIAL HELPERS & VALIDATION
// ============================================================================

export const cleanEnvValue = (val?: string | null): string => {
  if (!val || typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
};

export const cleanUrl = (raw?: string | null): string => {
  let url = cleanEnvValue(raw);
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, '');
};

export const isValidHttpUrl = (stringUrl?: string | null): boolean => {
  if (!stringUrl) return false;
  try {
    const url = new URL(stringUrl);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !stringUrl.includes('tu-proyecto') &&
      !stringUrl.includes('your-project-ref') &&
      !stringUrl.includes('placeholder')
    );
  } catch {
    return false;
  }
};

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  const url = cleanUrl(rawSupabaseUrl);
  const key = cleanEnvValue(rawSupabaseAnonKey);
  return Boolean(isValidHttpUrl(url) && key && key.length > 20 && !key.includes('tu-anon-public-key'));
};

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

export const supabase: SupabaseClient | null = (() => {
  try {
    if (!isSupabaseConfigured()) {
      if (typeof window !== 'undefined') {
        console.warn('%c[Supabase] NO CONFIGURADO (Usando IndexedDB local):', 'color: #f59e0b; font-weight: bold;', {
          url: rawSupabaseUrl || '(vacío o no detectado por Vite)',
          keyPresent: Boolean(rawSupabaseAnonKey)
        });
      }
      return null;
    }
    const url = cleanUrl(rawSupabaseUrl);
    const key = cleanEnvValue(rawSupabaseAnonKey);
    const client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    if (typeof window !== 'undefined') {
      console.log('%c[Supabase] CONECTADO A LA NUBE:', 'color: #10b981; font-weight: bold;', { url });
    }
    return client;
  } catch (err) {
    console.warn('[Supabase] No se pudo inicializar Supabase, usando IndexedDB local:', err);
    return null;
  }
})();

// ============================================================================
// DATA SANITIZATION (PREVENTS POSTGRESQL "invalid input syntax for type date: ''")
// ============================================================================

function sanitizeDate(d?: string | null): string | null {
  if (!d || typeof d !== 'string') return null;
  const trimmed = d.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  return null;
}

function sanitizeStr(s?: string | null): string | null {
  if (!s || typeof s !== 'string') return null;
  const trimmed = s.trim();
  return trimmed === '' ? null : trimmed;
}

export function sanitizeAlumnoForSupabase(alumno: Alumno) {
  return {
    id: String(alumno.id),
    organizacion_id: sanitizeStr(alumno.organizacion_id) || 'org-1',
    profesor_id: sanitizeStr(alumno.profesor_id) || 'prof-1',
    grupo_id: sanitizeStr(alumno.grupo_id),
    nombre: sanitizeStr(alumno.nombre) || 'Sin Nombre',
    apellido: sanitizeStr(alumno.apellido) || 'Sin Apellido',
    dni: sanitizeStr(alumno.dni),
    telefono: sanitizeStr(alumno.telefono) || '+5491100000000',
    email: sanitizeStr(alumno.email),
    direccion: sanitizeStr(alumno.direccion),
    fecha_nacimiento: sanitizeDate(alumno.fecha_nacimiento) || '1990-01-01',
    fecha_inicio: sanitizeDate(alumno.fecha_inicio) || new Date().toISOString().split('T')[0],
    estado_activo: alumno.estado_activo !== false,

    contacto_emergencia_nombre: sanitizeStr(alumno.contacto_emergencia_nombre),
    contacto_emergencia_telefono: sanitizeStr(alumno.contacto_emergencia_telefono),
    contacto_emergencia_parentesco: sanitizeStr(alumno.contacto_emergencia_parentesco),
    obra_social: sanitizeStr(alumno.obra_social),
    numero_afiliado: sanitizeStr(alumno.numero_afiliado),
    grupo_sanguineo: sanitizeStr(alumno.grupo_sanguineo),
    genero: alumno.genero || 'masculino',
    objetivo_principal: sanitizeStr(alumno.objetivo_principal),
    antecedentes_medicos: sanitizeStr(alumno.antecedentes_medicos),

    apto_medico_estado: alumno.apto_medico_estado || 'pendiente',
    apto_medico_vencimiento: sanitizeDate(alumno.apto_medico_vencimiento),
    ocupacion: sanitizeStr(alumno.ocupacion),
    notas_admision: sanitizeStr(alumno.notas_admision),

    fecha_pago_cuota: sanitizeDate(alumno.fecha_pago_cuota),
    fecha_vencimiento_cuota: sanitizeDate(alumno.fecha_vencimiento_cuota),
    cuota_al_dia: alumno.cuota_al_dia !== false,
    ultimo_monto_pago: Number(alumno.ultimo_monto_pago) || 0,

    alerta_lesion_activa: sanitizeStr(alumno.alerta_lesion_activa),
    zona_dolor_principal: sanitizeStr(alumno.zona_dolor_principal),
    dolor_eva_actual: Number(alumno.dolor_eva_actual) || 0.0,
    decision_actual: alumno.decision_actual || 'ENTRENAR',

    created_at: alumno.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function sanitizeRutinaForSupabase(rutina: Rutina) {
  return {
    id: String(rutina.id),
    alumno_id: String(rutina.alumno_id),
    nombre_rutina: sanitizeStr(rutina.nombre_rutina) || 'Rutina',
    fecha_inicio: sanitizeDate(rutina.fecha_inicio) || new Date().toISOString().split('T')[0],
    fecha_cambio: sanitizeDate(rutina.fecha_cambio) || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    activa: rutina.activa !== false,
    orden: Number(rutina.orden) || 1,
    notas_generales: sanitizeStr(rutina.notas_generales),
    updated_at: rutina.updated_at || new Date().toISOString(),
  };
}

// Normalizador de ejercicios para asegurar que separadores y campos se reconstruyan exactamente
function normalizeEjercicioFromDb(ej: any): EjercicioRutina {
  const isSep = Boolean(
    ej.es_separador ||
    (typeof ej.ejercicio === 'string' && (ej.ejercicio.includes('SEPARADOR') || ej.ejercicio.startsWith('—')))
  );

  let subtitulo = (ej.subtitulo_bloque || '').trim();
  if (isSep && !subtitulo && ej.ejercicio) {
    const raw = String(ej.ejercicio);
    const match = raw.match(/^—\s*SEPARADOR(?::\s*(.*?))?\s*—$/i);
    if (match && match[1]) {
      subtitulo = match[1].trim();
    } else if (raw !== '— SEPARADOR —' && raw !== '— SEPARADOR DE BLOQUE —') {
      subtitulo = raw.replace(/^—+\s*/, '').replace(/\s*—+$/, '').replace(/^SEPARADOR:\s*/i, '').trim();
    }
  }

  return {
    id: String(ej.id),
    bloque_id: String(ej.bloque_id),
    orden: Number(ej.orden) || 1,
    ejercicio: isSep ? (subtitulo ? `— SEPARADOR: ${subtitulo} —` : '— SEPARADOR DE BLOQUE —') : (ej.ejercicio || ''),
    series: isSep ? '' : (ej.series ? String(ej.series).trim() : ''),
    repeticiones: isSep ? '' : (ej.repeticiones ? String(ej.repeticiones).trim() : ''),
    carga: isSep ? '' : (ej.carga ? String(ej.carga).trim() : ''),
    carga_p2: isSep ? '' : (ej.carga_p2 ? String(ej.carga_p2).trim() : ''),
    pausa: isSep ? '' : (ej.pausa ? String(ej.pausa).trim() : ''),
    rpe_objetivo: isSep ? '' : (ej.rpe_objetivo ? String(ej.rpe_objetivo).trim() : ''),
    tipo_cadena: isSep ? undefined : (ej.tipo_cadena || undefined),
    observaciones_dosificacion: isSep ? '' : (ej.observaciones_dosificacion ? String(ej.observaciones_dosificacion).trim() : ''),
    video_url: isSep ? '' : (ej.video_url ? String(ej.video_url).trim() : ''),
    es_separador: isSep,
    subtitulo_bloque: subtitulo
  };
}

// ============================================================================
// SUPABASE CRUD METHODS
// ============================================================================

export async function fetchStudentsFromSupabase(): Promise<Alumno[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.warn('[Supabase] Error fetching alumnos:', error.message);
      return null;
    }
    return data as Alumno[];
  } catch (err) {
    console.warn('[Supabase] Connection error fetching alumnos:', err);
    return null;
  }
}

export async function saveStudentToSupabase(
  alumno: Alumno
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    console.warn('[Supabase] Guardado en la nube abortado: el cliente de Supabase no está conectado.');
    return { success: false, error: 'Supabase no está configurado.' };
  }
  try {
    const sanitized = sanitizeAlumnoForSupabase(alumno);

    if (sanitized.grupo_id) {
      try {
        await supabase.from('grupos').upsert(
          {
            id: sanitized.grupo_id,
            organizacion_id: sanitized.organizacion_id || 'org-1',
            profesor_id: sanitized.profesor_id || 'prof-1',
            nombre_grupo: 'Turno General',
            horario: 'General'
          },
          { onConflict: 'id' }
        );
      } catch (grpErr) {
        console.warn('[Supabase] Auto-creación de grupo omitida:', grpErr);
      }
    }

    let { error } = await supabase
      .from('alumnos')
      .upsert(sanitized, { onConflict: 'id' });

    if (error && error.message && error.message.includes('alumnos_grupo_id_fkey')) {
      console.warn('[Supabase] Clave foránea de grupo_id no encontrada. Reintentando con grupo_id null...');
      const fallback = { ...sanitized, grupo_id: null };
      const retry = await supabase.from('alumnos').upsert(fallback, { onConflict: 'id' });
      error = retry.error;
    }

    if (error) {
      console.error('[Supabase] Error devuelto por PostgreSQL:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Excepción de red al guardar alumno:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteStudentFromSupabase(alumnoId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    await supabase.from('rutinas').delete().eq('alumno_id', alumnoId);
    await supabase.from('evaluaciones_clinicas').delete().eq('alumno_id', alumnoId);
    await supabase.from('seguimiento_diario').delete().eq('alumno_id', alumnoId);

    const { error } = await supabase
      .from('alumnos')
      .delete()
      .eq('id', alumnoId);

    if (error) {
      console.warn('[Supabase] Error deleting alumno:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Connection error deleting alumno:', err);
    return false;
  }
}

export async function clearAllStudentsFromSupabase(): Promise<boolean> {
  if (!supabase) return false;
  try {
    await supabase.from('rutinas').delete().neq('id', 'placeholder');
    await supabase.from('evaluaciones_clinicas').delete().neq('id', 'placeholder');
    await supabase.from('seguimiento_diario').delete().neq('id', 'placeholder');
    await supabase.from('alumnos').delete().neq('id', 'placeholder');
    return true;
  } catch (err) {
    console.warn('[Supabase] Error clearing all alumnos from cloud:', err);
    return false;
  }
}

export async function fetchGroupsFromSupabase(): Promise<Grupo[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('grupos')
      .select('*')
      .order('nombre_grupo', { ascending: true });

    if (error) {
      console.warn('[Supabase] Error fetching grupos:', error.message);
      return null;
    }
    return data as Grupo[];
  } catch (err) {
    console.warn('[Supabase] Connection error fetching grupos:', err);
    return null;
  }
}

export async function saveGroupToSupabase(grupo: Grupo): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('grupos')
      .upsert({
        id: String(grupo.id),
        profesor_id: sanitizeStr(grupo.profesor_id) || 'prof-1',
        organizacion_id: sanitizeStr(grupo.organizacion_id) || 'org-1',
        nombre_grupo: sanitizeStr(grupo.nombre_grupo) || 'Grupo',
        horario: sanitizeStr(grupo.horario) || 'General',
        descripcion: sanitizeStr(grupo.descripcion),
      }, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Error saving grupo:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Connection error saving grupo:', err);
    return false;
  }
}

export async function deleteGroupFromSupabase(grupoId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('grupos')
      .delete()
      .eq('id', grupoId);

    if (error) {
      console.warn('[Supabase] Error deleting grupo:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Connection error deleting grupo:', err);
    return false;
  }
}

export async function fetchRoutinesFromSupabase(alumnoId: string): Promise<Rutina[] | null> {
  if (!supabase) return null;
  try {
    // 1. Obtener rutinas del alumno
    const { data: ruts, error: rError } = await supabase
      .from('rutinas')
      .select('*')
      .eq('alumno_id', alumnoId)
      .order('orden', { ascending: true });

    if (rError) {
      console.warn('[Supabase] Error fetching rutinas:', rError.message);
      return [];
    }

    if (!ruts || ruts.length === 0) return [];

    const rutIds = ruts.map((r) => String(r.id));

    // 2. Obtener bloques de esas rutinas
    const { data: blks, error: bError } = await supabase
      .from('bloques_rutina')
      .select('*')
      .in('rutina_id', rutIds)
      .order('orden', { ascending: true });

    if (bError) {
      console.warn('[Supabase] Error fetching bloques_rutina:', bError.message);
    }

    const validBlks = blks || [];
    const blkIds = validBlks.map((b) => String(b.id));

    // 3. Obtener ejercicios de esos bloques
    let ejs: any[] = [];
    if (blkIds.length > 0) {
      const { data: fetchedEjs, error: eError } = await supabase
        .from('ejercicios_rutina')
        .select('*')
        .in('bloque_id', blkIds)
        .order('orden', { ascending: true });

      if (eError) {
        console.warn('[Supabase] Error fetching ejercicios_rutina:', eError.message);
      } else {
        ejs = fetchedEjs || [];
      }
    }

    // 4. Mapear y reconstruir estructura jerárquica
    const ejsByBlock: Record<string, EjercicioRutina[]> = {};
    ejs.forEach((e) => {
      const bKey = String(e.bloque_id);
      if (!ejsByBlock[bKey]) ejsByBlock[bKey] = [];
      ejsByBlock[bKey].push(normalizeEjercicioFromDb(e));
    });

    Object.keys(ejsByBlock).forEach((bid) => {
      ejsByBlock[bid].sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
    });

    const blksByRoutine: Record<string, any[]> = {};
    validBlks.forEach((b) => {
      const rKey = String(b.rutina_id);
      if (!blksByRoutine[rKey]) blksByRoutine[rKey] = [];
      blksByRoutine[rKey].push({
        ...b,
        ejercicios: ejsByBlock[String(b.id)] || []
      });
    });

    Object.keys(blksByRoutine).forEach((rid) => {
      blksByRoutine[rid].sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
    });

    return ruts.map((r) => ({
      ...r,
      bloques: blksByRoutine[String(r.id)] || []
    })) as Rutina[];
  } catch (err) {
    console.warn('[Supabase] Connection error fetching rutinas:', err);
    return null;
  }
}

export async function saveRoutineToSupabase(
  rutina: Rutina
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase no está configurado.' };
  }
  try {
    // 1. Guardar cabecera de la Rutina respetando el updated_at exacto local
    const sanitizedRutina = sanitizeRutinaForSupabase(rutina);
    const { error: rutError } = await supabase
      .from('rutinas')
      .upsert(sanitizedRutina, { onConflict: 'id' });

    if (rutError) throw rutError;

    // 2. Sincronizar y limpiar Bloques & Ejercicios
    if (rutina.bloques && Array.isArray(rutina.bloques)) {
      const activeBlockIds = rutina.bloques.map((b) => String(b.id));

      // 2a. Guardar cada bloque y sus ejercicios
      for (let bIdx = 0; bIdx < rutina.bloques.length; bIdx++) {
        const bloque = rutina.bloques[bIdx];
        const blockOrder = Number(bloque.orden) || (bIdx + 1);

        const { error: blkError } = await supabase
          .from('bloques_rutina')
          .upsert({
            id: String(bloque.id),
            rutina_id: String(rutina.id),
            nombre_sub_pestana: String(bloque.nombre_sub_pestana || `Día ${bIdx + 1}`).trim(),
            orden: blockOrder
          }, { onConflict: 'id' });

        if (blkError) throw blkError;

        const currentEjercicios = Array.isArray(bloque.ejercicios) ? bloque.ejercicios : [];
        const activeEjIds = currentEjercicios.map((e) => String(e.id));

        // Upsert de los ejercicios actuales garantizando no violar restricciones NOT NULL de Postgres
        for (let eIdx = 0; eIdx < currentEjercicios.length; eIdx++) {
          const ej = currentEjercicios[eIdx];
          const calculatedOrder = Number(ej.orden) || (eIdx + 1);

          const isSep = Boolean(
            ej.es_separador ||
            (typeof ej.ejercicio === 'string' && (ej.ejercicio.includes('SEPARADOR') || ej.ejercicio.startsWith('—')))
          );

          let ejercicioStr = '';
          if (isSep) {
            const subTitle = (ej.subtitulo_bloque || '').trim();
            ejercicioStr = subTitle ? `— SEPARADOR: ${subTitle} —` : '— SEPARADOR DE BLOQUE —';
          } else {
            ejercicioStr = (ej.ejercicio || '').trim() || 'Ejercicio';
          }

          // Postgres tiene restricciones NOT NULL en ejercicio, series, repeticiones y pausa
          const { error: ejError } = await supabase
            .from('ejercicios_rutina')
            .upsert({
              id: String(ej.id),
              bloque_id: String(bloque.id),
              orden: calculatedOrder,
              ejercicio: ejercicioStr,
              series: isSep ? '' : (ej.series ? String(ej.series).trim() : ''),
              repeticiones: isSep ? '' : (ej.repeticiones ? String(ej.repeticiones).trim() : ''),
              carga: isSep ? '' : (ej.carga ? String(ej.carga).trim() : ''),
              carga_p2: isSep ? '' : (ej.carga_p2 ? String(ej.carga_p2).trim() : ''),
              pausa: isSep ? '' : (ej.pausa ? String(ej.pausa).trim() : ''),
              rpe_objetivo: isSep ? '' : (ej.rpe_objetivo ? String(ej.rpe_objetivo).trim() : ''),
              tipo_cadena: isSep ? '' : (ej.tipo_cadena ? String(ej.tipo_cadena).trim() : ''),
              observaciones_dosificacion: isSep ? '' : (ej.observaciones_dosificacion ? String(ej.observaciones_dosificacion).trim() : ''),
              video_url: isSep ? '' : (ej.video_url ? String(ej.video_url).trim() : '')
            }, { onConflict: 'id' });

          if (ejError) throw ejError;
        }

        // Limpiar ejercicios huérfanos/eliminados en Supabase para este bloque
        if (activeEjIds.length > 0) {
          const { data: existingEjs } = await supabase
            .from('ejercicios_rutina')
            .select('id')
            .eq('bloque_id', String(bloque.id));

          if (existingEjs && existingEjs.length > 0) {
            const ejsToDelete = existingEjs
              .filter((ee) => !activeEjIds.includes(ee.id))
              .map((ee) => ee.id);

            if (ejsToDelete.length > 0) {
              await supabase.from('ejercicios_rutina').delete().in('id', ejsToDelete);
            }
          }
        }
      }

      // 2b. Eliminar de Supabase los bloques huérfanos eliminados por el usuario
      if (activeBlockIds.length > 0) {
        const { data: existingBlocks } = await supabase
          .from('bloques_rutina')
          .select('id')
          .eq('rutina_id', String(rutina.id));

        if (existingBlocks && existingBlocks.length > 0) {
          const blocksToDelete = existingBlocks
            .filter((eb) => !activeBlockIds.includes(eb.id))
            .map((eb) => eb.id);

          if (blocksToDelete.length > 0) {
            await supabase.from('ejercicios_rutina').delete().in('bloque_id', blocksToDelete);
            await supabase.from('bloques_rutina').delete().in('id', blocksToDelete);
          }
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Error saving rutina:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteRoutineFromSupabase(rutinaId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('rutinas')
      .delete()
      .eq('id', rutinaId);

    if (error) {
      console.warn('[Supabase] Error deleting rutina:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Connection error deleting rutina:', err);
    return false;
  }
}

// ============================================================================
// PAGOS & CUOTAS MENSUALES
// ============================================================================

export async function fetchPagosFromSupabase(): Promise<PagoCuota[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .order('fecha_pago', { ascending: false });

    if (error) {
      console.warn('[Supabase] Error fetching pagos:', error.message);
      return null;
    }
    return (data || []) as PagoCuota[];
  } catch (err) {
    console.warn('[Supabase] Connection error fetching pagos:', err);
    return null;
  }
}

export async function savePagoToSupabase(
  pago: PagoCuota
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase no está configurado.' };
  }
  try {
    const record = {
      id: String(pago.id),
      alumno_id: String(pago.alumno_id),
      alumno_nombre: sanitizeStr(pago.alumno_nombre) || 'Alumno',
      grupo_id: sanitizeStr(pago.grupo_id),
      grupo_nombre: sanitizeStr(pago.grupo_nombre),
      monto: Number(pago.monto) || 0,
      fecha_pago: sanitizeDate(pago.fecha_pago) || new Date().toISOString().split('T')[0],
      fecha_vencimiento: sanitizeDate(pago.fecha_vencimiento) || new Date().toISOString().split('T')[0],
      mes_correspondiente: sanitizeStr(pago.mes_correspondiente) || 'Actual',
      metodo_pago: sanitizeStr(pago.metodo_pago) || 'efectivo',
      notas: sanitizeStr(pago.notas),
      created_at: pago.created_at || new Date().toISOString(),
    };

    const { error } = await supabase
      .from('pagos')
      .upsert(record, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Error saving pago:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Error saving pago:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deletePagoFromSupabase(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('pagos')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[Supabase] Error deleting pago:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Connection error deleting pago:', err);
    return false;
  }
}