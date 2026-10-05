import React from 'react';
import { Alumno } from '../types';
import { AlertCircle, UserPlus, X, Zap } from 'lucide-react';

interface BottomDockProps {
  activeStudents: Alumno[];
  selectedStudentId: string | null;
  onSelectStudent: (student: Alumno) => void;
  onRemoveFromDock: (studentId: string, e: React.MouseEvent) => void;
  onOpenStudentDirectory: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeStudents,
  selectedStudentId,
  onSelectStudent,
  onRemoveFromDock,
  onOpenStudentDirectory,
}) => {
  return (
    <aside aria-label="Modo Sala de Musculación" className="fixed bottom-0 left-0 right-0 z-40 bg-[#090D16]/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 sm:px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* Dock Label */}
        <div className="hidden lg:flex items-center gap-1.5 pr-2 border-r border-slate-800/80 shrink-0 text-slate-400">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            Sala Activa
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({activeStudents.length}/8)
          </span>
        </div>

        {/* Active Students Dock Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 overflow-x-auto py-0.5 no-scrollbar">
          {activeStudents.map((alumno) => {
            const isSelected = alumno.id === selectedStudentId;
            const hasAlert = alumno.alerta_lesion_activa || (alumno.dolor_eva_actual && alumno.dolor_eva_actual > 0);
            const isDerivar = alumno.decision_actual === 'DERIVAR';

            return (
              <div
                key={alumno.id}
                onClick={() => onSelectStudent(alumno)}
                className={`relative group shrink-0 flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-xl border cursor-pointer transition-all duration-150 min-h-[44px] ${
                  isSelected
                    ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                {/* Avatar with status border */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isDerivar
                      ? 'bg-rose-950 text-rose-300 border border-rose-600'
                      : 'bg-slate-800 text-emerald-300 border border-emerald-600/40'
                  }`}
                >
                  {alumno.nombre.charAt(0)}{alumno.apellido.charAt(0)}
                </div>

                {/* Name & Quick Status */}
                <div className="text-left pr-1 max-w-[110px] sm:max-w-[130px]">
                  <p className="text-xs font-semibold truncate leading-tight">
                    {alumno.nombre} {alumno.apellido.charAt(0)}.
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {hasAlert ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-mono">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>EVA {alumno.dolor_eva_actual ?? '!'}/10</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400/80 font-mono">
                        OK Carga
                      </span>
                    )}
                  </div>
                </div>

                {/* Close/Remove from active dock */}
                <button
                  onClick={(e) => onRemoveFromDock(alumno.id, e)}
                  aria-label={`Quitar a ${alumno.nombre} de sala activa`}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800/80 opacity-60 group-hover:opacity-100 transition-opacity"
                  title="Quitar de sala activa"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Hover Quick Clinical Tooltip for Floor Safety */}
                {alumno.alerta_lesion_activa && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 rounded-xl bg-slate-900 border border-amber-600/60 shadow-2xl text-left text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <p className="font-semibold text-amber-300 flex items-center gap-1 text-[11px] mb-1">
                      <AlertCircle className="w-3 h-3" /> Precaución Biomecánica:
                    </p>
                    <p className="text-slate-200 text-[11px] leading-snug">
                      {alumno.alerta_lesion_activa}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Student to Dock button if under 8 */}
          {activeStudents.length < 8 && (
            <button
              onClick={onOpenStudentDirectory}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-700/80 bg-slate-900/40 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 text-xs font-medium min-h-[44px] transition-colors"
              title="Añadir alumno presente a sala activa"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sumar a Sala</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
