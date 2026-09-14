import { useState } from 'react';
import { useExcusas } from '../hooks/useExcusas';
import ModalCierreIndefinida from '../components/excusas/ModalCierreIndefinida';
import DetalleExcusaModal from '../components/excusas/DetalleExcusaModal';
import { Clock, CheckCircle2, Eye, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ExcusasAbiertasPage() {
  const { excusas, loading, refetch } = useExcusas({ abiertas: 'true' });
  const [excusaSeleccionada, setExcusaSeleccionada] = useState(null);
  const [modalCierreOpen, setModalCierreOpen] = useState(false);
  const [detalleId, setDetalleId] = useState(null);

  const handleCerrar = (excusa) => {
    setExcusaSeleccionada(excusa);
    setModalCierreOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600" />
          Cierre Formal de Excusas Indefinidas (HU-08)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Lista de inasistencias médicas o prolongadas que se encuentran abiertas a la espera de fecha de retorno y soporte médico de alta.
        </p>
      </div>

      {/* Tarjeta explicativa */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Protocolo Institucional:</strong> Cuando el estudiante se reincorpora a clases tras una incapacidad o inasistencia indefinida, debe ingresar la fecha real de retorno y cargar obligatoriamente el soporte médico emitido por la EPS o médico tratante.
        </div>
      </div>

      {/* Lista de Excusas Abiertas */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          Cargando excusas abiertas...
        </div>
      ) : excusas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">¡Al día! No tiene excusas indefinidas pendientes de cierre</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Todas sus inasistencias registradas han sido cerradas formalmente o tenían una fecha definida.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {excusas.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs hover:border-amber-400 transition-all space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-mono font-bold text-sm text-blue-900">
                  {item.radicado}
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                  Pendiente de Cierre
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Inicio de Inasistencia:</span>
                  <span className="font-bold text-slate-800">{item.fecha_desde}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Motivo:</span>
                  <span className="font-bold text-blue-950">{item.motivo}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {item.descripcion}
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setDetalleId(item.id)}
                  className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 py-1.5 sm:py-0 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Detalle</span>
                </button>

                <button
                  onClick={() => handleCerrar(item)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registrar Retorno y Alta</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      <ModalCierreIndefinida
        isOpen={modalCierreOpen}
        onClose={() => setModalCierreOpen(false)}
        excusa={excusaSeleccionada}
        onCierreExitoso={() => {
          refetch();
          setModalCierreOpen(false);
        }}
      />

      <DetalleExcusaModal
        isOpen={!!detalleId}
        onClose={() => setDetalleId(null)}
        excusaId={detalleId}
        onActualizado={refetch}
      />

    </div>
  );
}
