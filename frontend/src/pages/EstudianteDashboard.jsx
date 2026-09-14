import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExcusas } from '../hooks/useExcusas';
import TablaExcusas from '../components/excusas/TablaExcusas';
import DetalleExcusaModal from '../components/excusas/DetalleExcusaModal';
import ModalCierreIndefinida from '../components/excusas/ModalCierreIndefinida';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  HelpCircle
} from 'lucide-react';

export default function EstudianteDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { excusas, loading, refetch } = useExcusas();

  const [excusaSeleccionada, setExcusaSeleccionada] = useState(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [excusaParaCerrar, setExcusaParaCerrar] = useState(null);
  const [modalCierreOpen, setModalCierreOpen] = useState(false);

  // Cálculos estadísticos
  const total = excusas.length;
  const abiertas = excusas.filter(e => Boolean(e.es_indefinida) && !e.fecha_retorno);
  const cerradas = excusas.filter(e => Boolean(e.es_indefinida) && Boolean(e.fecha_retorno));
  const definidas = excusas.filter(e => !e.es_indefinida);

  const handleVerDetalle = (excusa) => {
    setExcusaSeleccionada(excusa);
    setModalDetalleOpen(true);
  };

  const handleCerrarIndefinida = (excusa) => {
    setExcusaParaCerrar(excusa);
    setModalCierreOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header del Dashboard Estudiantil */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Mis Excusas Escolares
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historial oficial de radicación de inasistencias y seguimiento institucional
          </p>
        </div>

        <button
          onClick={() => navigate('/portal/radicar')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Radicar Nueva Excusa (HU-02)</span>
        </button>
      </div>

      {/* Alerta si tiene excusas indefinidas abiertas (HU-08) */}
      {abiertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                Atención: Tiene {abiertas.length} excusa(s) indefinida(s) pendiente(s) de cierre formal (HU-08)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Al reincorporarse a la jornada escolar, debe registrar la fecha de retorno y adjuntar el soporte médico de alta.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/portal/abiertas')}
            className="w-full sm:w-auto text-center px-3.5 py-2 sm:py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Gestionar Cierre
          </button>
        </div>
      )}

      {/* Tarjetas de Resumen Numérico */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Radicadas
          </span>
          <div className="flex items-center justify-between mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{total}</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Definidas
          </span>
          <div className="flex items-center justify-between mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-blue-700">{definidas.length}</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Abiertas (HU-08)
          </span>
          <div className="flex items-center justify-between mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-700">{abiertas.length}</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Cerradas con Alta
          </span>
          <div className="flex items-center justify-between mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">{cerradas.length}</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
        </div>

      </div>

      {/* Tabla de Excusas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Registro Cronológico de Mis Excusas
          </h3>
          <span className="text-xs text-slate-400">
            {excusas.length} registro(s)
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
            Cargando excusas registradas...
          </div>
        ) : (
          <TablaExcusas
            excusas={excusas}
            showEstudianteCol={false}
            onVerDetalle={handleVerDetalle}
            onCerrarIndefinida={handleCerrarIndefinida}
          />
        )}
      </div>

      {/* Modales */}
      <DetalleExcusaModal
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        excusaId={excusaSeleccionada?.id}
        onActualizado={refetch}
      />

      <ModalCierreIndefinida
        isOpen={modalCierreOpen}
        onClose={() => setModalCierreOpen(false)}
        excusa={excusaParaCerrar}
        onCierreExitoso={() => {
          refetch();
          setModalCierreOpen(false);
        }}
      />

    </div>
  );
}
