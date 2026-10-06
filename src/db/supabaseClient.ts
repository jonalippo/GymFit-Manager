import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Alumno, Grupo, Rutina, EvaluacionClinica, SeguimientoDiario } from '../types';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const cleanEnvValue = (val?: string): string => {
  if (!val || typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
};

export const cleanUrl = (raw?: string): string => {
  let url = cleanEnvValue(raw);
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
};

export const isValidHttpUrl = (stringUrl?: string): boolean => {
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

export const isSupabaseConfigured = (): boolean => {
  const url = cleanUrl(rawSupabaseUrl);
  const key = cleanEnvValue(rawSupabaseAnonKey);
  return Boolean(isValidHttpUrl(url) && key && key.length > 20 && !key.includes('tu-anon-public-key'));
};

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
    console.warn('[Supabase] Connection error:', err);
    return null;
  }
}

export async function saveStudentToSupabase(alumno: Alumno): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('alumnos')
      .upsert(alumno, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Error saving alumno:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Connection error:', err);
    return false;
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
    console.warn('[Supabase] Connection error:', err);
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
    console.warn('[Supabase] Connection error:', err);
    return null;
  }
}

export async function saveGroupToSupabase(grupo: Grupo): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('grupos')
      .upsert(grupo, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Error saving grupo:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Connection error:', err);
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
    console.warn('[Supabase] Connection error:', err);
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

    // Fallback directo por tablas
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

export async function saveRoutineToSupabase(rutina: Rutina): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error: rutError } = await supabase
      .from('rutinas')
      .upsert({
        id: rutina.id,
        alumno_id: rutina.alumno_id,
        nombre_rutina: rutina.nombre_rutina,
        fecha_inicio: rutina.fecha_inicio,
        fecha_cambio: rutina.fecha_cambio,
        activa: rutina.activa,
        orden: rutina.orden,
        notas_generales: rutina.notas_generales,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (rutError) throw rutError;

    for (const bloque of rutina.bloques) {
      const { error: blkError } = await supabase
        .from('bloques_rutina')
        .upsert({
          id: bloque.id,
          rutina_id: rutina.id,
          nombre_sub_pestana: bloque.nombre_sub_pestana,
          orden: bloque.orden
        }, { onConflict: 'id' });

      if (blkError) throw blkError;

      for (const ej of bloque.ejercicios) {
        const { error: ejError } = await supabase
          .from('ejercicios_rutina')
          .upsert({
            id: ej.id,
            bloque_id: bloque.id,
            orden: ej.orden,
            ejercicio: ej.ejercicio,
            series: ej.series,
            repeticiones: ej.repeticiones,
            carga: ej.carga || null,
            pausa: ej.pausa,
            rpe_objetivo: ej.rpe_objetivo || null,
            tipo_cadena: ej.tipo_cadena || null,
            observaciones_dosificacion: ej.observaciones_dosificacion,
            video_url: ej.video_url || null
          }, { onConflict: 'id' });

        if (ejError) throw ejError;
      }
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Error saving rutina:', err);
    return false;
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
    console.warn('[Supabase] Connection error:', err);
    return false;
  }
}