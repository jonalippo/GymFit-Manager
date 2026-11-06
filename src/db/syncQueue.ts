import { getSyncIdentity, getSyncQueue, removeSyncQueueItems } from './indexedDb';
import {
  deleteGroupFromSupabase,
  deletePagoFromSupabase,
  deleteRoutineFromSupabase,
  deleteStudentFromSupabase,
  isSupabaseConfigured,
  saveEvaluacionToSupabase,
  saveGroupToSupabase,
  savePagoToSupabase,
  saveRoutineToSupabase,
  saveSeguimientoToSupabase,
  saveStudentToSupabase,
} from './supabaseClient';

type QueuedMutation = {
  id: number;
  table: string;
  action: 'upsert' | 'insert' | 'delete';
  record_id: string;
  payload?: unknown;
  owner_user_id?: string | null;
  owner_profesor_id?: string | null;
};

/**
 * Replays local mutations in order. A mutation is removed only after Supabase
 * acknowledges it, so a transient network or permission error never loses data.
 */
export async function syncPendingMutations(): Promise<{ synced: number; pending: number }> {
  if (!isSupabaseConfigured() || typeof navigator !== 'undefined' && !navigator.onLine) {
    const queued = await getSyncQueue();
    return { synced: 0, pending: queued.length };
  }

  const queued = (await getSyncQueue()) as QueuedMutation[];
  const identity = getSyncIdentity();
  if (!identity) return { synced: 0, pending: queued.length };
  const acknowledged: number[] = [];

  for (const mutation of queued) {
    // Legacy mutations have no owner and are retained for explicit recovery;
    // they are never replayed under an unrelated session.
    if (mutation.owner_user_id !== identity.userId) continue;
    let success = false;
    const payload: any = mutation.payload;
    try {
      switch (`${mutation.table}:${mutation.action}`) {
        case 'alumnos:upsert': success = (await saveStudentToSupabase(payload)).success; break;
        case 'alumnos:delete': success = await deleteStudentFromSupabase(mutation.record_id); break;
        case 'grupos:upsert': success = await saveGroupToSupabase(payload); break;
        case 'grupos:delete': success = await deleteGroupFromSupabase(mutation.record_id); break;
        case 'rutinas:upsert': success = (await saveRoutineToSupabase(payload)).success; break;
        case 'rutinas:delete': success = await deleteRoutineFromSupabase(mutation.record_id); break;
        case 'evaluaciones_clinicas:upsert': success = (await saveEvaluacionToSupabase(payload)).success; break;
        case 'seguimiento_diario:insert':
        case 'seguimiento_diario:upsert': success = (await saveSeguimientoToSupabase(payload)).success; break;
        case 'pagos:upsert': success = (await savePagoToSupabase(payload)).success; break;
        case 'pagos:delete': success = await deletePagoFromSupabase(mutation.record_id); break;
        default: continue;
      }
    } catch (error) {
      console.warn('[SyncQueue] Mutation will be retried:', mutation, error);
    }
    if (success) acknowledged.push(mutation.id);
  }

  await removeSyncQueueItems(acknowledged);
  return { synced: acknowledged.length, pending: queued.length - acknowledged.length };
}
