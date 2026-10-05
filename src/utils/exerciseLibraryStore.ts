import { LibraryExercise } from '../types';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';

const STORAGE_KEY = 'gymfitpro_exercise_library';

export function getExerciseLibrary(): LibraryExercise[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading exercise library from localStorage', err);
  }

  // Initialize with default library and ensure IDs
  const initial: LibraryExercise[] = EXERCISE_LIBRARY.map((ex, idx) => ({
    ...ex,
    id: ex.id || `def-${idx}-${ex.nombre.replace(/\s+/g, '-').toLowerCase().slice(0, 15)}`
  }));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch (err) {
    console.error('Error saving initial exercise library', err);
  }

  return initial;
}

export function saveExerciseLibrary(exercises: LibraryExercise[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
  } catch (err) {
    console.error('Error saving exercise library', err);
  }
}

export function addExerciseToLibrary(exerciseData: Omit<LibraryExercise, 'id'>): LibraryExercise {
  const current = getExerciseLibrary();
  const newEx: LibraryExercise = {
    ...exerciseData,
    id: `custom-${Date.now()}`
  };
  const updated = [newEx, ...current];
  saveExerciseLibrary(updated);
  return newEx;
}

export function updateExerciseInLibrary(updatedExercise: LibraryExercise): void {
  const current = getExerciseLibrary();
  const index = current.findIndex(
    (e) => (e.id && e.id === updatedExercise.id) || e.nombre.toLowerCase() === updatedExercise.nombre.toLowerCase()
  );
  if (index >= 0) {
    current[index] = { ...current[index], ...updatedExercise };
  } else {
    current.unshift(updatedExercise);
  }
  saveExerciseLibrary([...current]);
}

export function deleteExerciseFromLibrary(exerciseIdOrName: string): void {
  const current = getExerciseLibrary();
  const filtered = current.filter(
    (e) => e.id !== exerciseIdOrName && e.nombre !== exerciseIdOrName
  );
  saveExerciseLibrary(filtered);
}
