import { Lock, ShieldAlert, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export function ModalidadBadge({ esIndefinida, fechaRetorno }) {
  if (!esIndefinida) {
    return (
      <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
        Definida
      </span>
    );
  }

  if (fechaRetorno) {
    return (
      <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Cerrada ({fechaRetorno})</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse shrink-0">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>Abierta (HU-08)</span>
    </span>
  );
}

// HU-09: Badge y aviso de confidencialidad para anexos restringidos
export function RestringidoBadge({ isDocente = false }) {
  return (
    <span
      title={isDocente ? "Documento confidencial reservado para Coordinación" : "Anexo Restringido"}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0"
    >
      <Lock className="w-3 h-3 text-rose-700 shrink-0" />
      <span>{isDocente ? "Confidencial" : "Restringido"}</span>
    </span>
  );
}
