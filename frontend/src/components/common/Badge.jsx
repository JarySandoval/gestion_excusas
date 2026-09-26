import { Lock, CheckCircle2, Clock, Ban } from 'lucide-react';
import { calcularEstadoExcusa } from '../../utils/estados';

export function ModalidadBadge({ esIndefinida, fechaRetorno, fechaHasta, esAnulada, motivoAnulacion, showModalidadHint = false }) {
  const info = calcularEstadoExcusa({ esIndefinida, fechaRetorno, fechaHasta, esAnulada, motivoAnulacion });

  if (info.estado === 'Anulada') {
    return (
      <span
        title={info.descripcion}
        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 line-through decoration-rose-400 shrink-0"
      >
        <Ban className="w-3 h-3 text-rose-500 shrink-0 no-underline" />
        <span>Anulada</span>
        {showModalidadHint && (
          <span className="text-[10px] font-normal text-rose-400">({info.modalidad})</span>
        )}
      </span>
    );
  }

  if (info.estado === 'Vigente') {
    return (
      <span
        title={info.descripcion}
        className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs shrink-0"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Vigente</span>
        {info.subtexto && info.subtexto !== 'Indefinida' && info.subtexto !== 'Definida' && (
          <span className="text-[10px] font-normal text-emerald-700">({info.subtexto})</span>
        )}
        {showModalidadHint && (
          <span className="text-[10px] font-normal text-emerald-600">({info.modalidad})</span>
        )}
      </span>
    );
  }

  if (info.estado === 'Expirada') {
    return (
      <span
        title={info.descripcion}
        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 shrink-0"
      >
        <Clock className="w-3 h-3 text-slate-500 shrink-0" />
        <span>Expirada</span>
        {showModalidadHint && (
          <span className="text-[10px] font-normal text-slate-400">({info.modalidad})</span>
        )}
      </span>
    );
  }

  // Terminada (Indefinida formalmente concluida con retorno cumplido)
  return (
    <span
      title={info.descripcion}
      className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-bold bg-teal-50 text-teal-800 border border-teal-300 shrink-0"
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
      <span>Terminada</span>
      {info.subtexto && (
        <span className="text-[10px] font-normal text-teal-600">({info.subtexto})</span>
      )}
    </span>
  );
}

// Alias para claridad de nomenclatura
export const EstadoBadge = ModalidadBadge;

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
