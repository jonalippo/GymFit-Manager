import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Alumno, Grupo, Rutina, EvaluacionClinica, SeguimientoDiario } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project-ref.supabase.co' &&
    !supabaseUrl.includes('placeholder')
  );
};

// Safe Supabase client initialization (never crashes if env vars are missing or offline)
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// ============================================================================
// SUPABASE SYNC & CRUD HELPERS
// Used seamlessly by the application when VITE_SUPABASE_URL is configured
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

    if (error) {
      console.warn('[Supabase] Error fetching rutinas:', error.message);
      return null;
    }
    return data as Rutina[];
  } catch (err) {
    console.warn('[Supabase] Connection error:', err);
    return null;
  }
}

export async function saveRoutineToSupabase(rutina: Rutina): Promise<boolean> {
  if (!supabase) return false;
  try {
    // 1. Save Rutina header
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

    // 2. Save Bloques & Ejercicios
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
