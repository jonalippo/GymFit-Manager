import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Alumno, Grupo, Rutina, EvaluacionClinica, SeguimientoDiario, BloqueRutina, EjercicioRutina } from '../types';

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
      return null;
    }
    const url = cleanUrl(rawSupabaseUrl);
    const key = cleanEnvValue(rawSupabaseAnonKey);
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('[Supabase] No se pudo inicializar Supabase, usando IndexedDB local:', err);
    return null;
  }
})();

// ============================================================================
// DATA SANITIZATION (PREVIENE ERROR 22007 "invalid input syntax for type date: ''")
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
    updated_at: new Date().toISOString(),
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
    return { success: false, error: 'Supabase no está configurado.' };
  }
  try {
    const sanitized = sanitizeAlumnoForSupabase(alumno);
    const { error } = await supabase
      .from('alumnos')
      .upsert(sanitized, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] Error saving alumno:', error.message, error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Exception saving alumno:', err);
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
    const { data, error } = await supabase
      .from('rutinas')
      .select(`
        *,
        bloques:bloques_rutina (
          *,
          ejercicios:ejercicios_rutina (*)
        )
      `)
      .eq('alumno_id', alumnoId)
      .order('orden', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as Rutina[];
    }

    const { data: ruts, error: rError } = await supabase
      .from('rutinas')
      .select('*')
      .eq('alumno_id', alumnoId)
      .order('orden', { ascending: true });

    if (rError || !ruts || ruts.length === 0) return [];

    const rutIds = ruts.map((r) => r.id);
    const { data: blks } = await supabase
      .from('bloques_rutina')
      .select('*')
      .in('rutina_id', rutIds)
      .order('orden', { ascending: true });

    const blkIds = (blks || []).map((b) => b.id);
    const { data: ejs } = await supabase
      .from('ejercicios_rutina')
      .select('*')
      .in('bloque_id', blkIds)
      .order('orden', { ascending: true });

    const ejsByBlock: Record<string, any[]> = {};
    (ejs || []).forEach((e) => {
      if (!ejsByBlock[e.bloque_id]) ejsByBlock[e.bloque_id] = [];
      ejsByBlock[e.bloque_id].push(e);
    });

    const blksByRoutine: Record<string, any[]> = {};
    (blks || []).forEach((b) => {
      if (!blksByRoutine[b.rutina_id]) blksByRoutine[b.rutina_id] = [];
      blksByRoutine[b.rutina_id].push({
        ...b,
        ejercicios: ejsByBlock[b.id] || []
      });
    });

    return ruts.map((r) => ({
      ...r,
      bloques: blksByRoutine[r.id] || []
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
    // 1. Guardar cabecera de la Rutina
    const sanitizedRutina = sanitizeRutinaForSupabase(rutina);
    const { error: rutError } = await supabase
      .from('rutinas')
      .upsert(sanitizedRutina, { onConflict: 'id' });

    if (rutError) throw rutError;

    // 2. Guardar Bloques & Ejercicios
    if (rutina.bloques && Array.isArray(rutina.bloques)) {
      for (const bloque of rutina.bloques) {
        const { error: blkError } = await supabase
          .from('bloques_rutina')
          .upsert({
            id: String(bloque.id),
            rutina_id: String(rutina.id),
            nombre_sub_pestana: String(bloque.nombre_sub_pestana || 'Día 1').trim(),
            orden: Number(bloque.orden) || 1
          }, { onConflict: 'id' });

        if (blkError) throw blkError;

        if (bloque.ejercicios && Array.isArray(bloque.ejercicios)) {
          for (const ej of bloque.ejercicios) {
            const { error: ejError } = await supabase
              .from('ejercicios_rutina')
              .upsert({
                id: String(ej.id),
                bloque_id: String(bloque.id),
                orden: Number(ej.orden) || 1,
                ejercicio: sanitizeStr(ej.ejercicio) || 'Ejercicio',
                series: sanitizeStr(ej.series) || '3',
                repeticiones: sanitizeStr(ej.repeticiones) || '10',
                carga: sanitizeStr(ej.carga),
                pausa: sanitizeStr(ej.pausa) || '60s',
                rpe_objetivo: sanitizeStr(ej.rpe_objetivo),
                tipo_cadena: sanitizeStr(ej.tipo_cadena),
                observaciones_dosificacion: sanitizeStr(ej.observaciones_dosificacion),
                video_url: sanitizeStr(ej.video_url)
              }, { onConflict: 'id' });

            if (ejError) throw ejError;
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