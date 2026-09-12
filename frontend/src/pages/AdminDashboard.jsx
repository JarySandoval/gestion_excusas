import { useState } from 'react';
import { useExcusas } from '../hooks/useExcusas';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import AdvancedFilterBar from '../components/filters/AdvancedFilterBar';
import TablaExcusas from '../components/excusas/TablaExcusas';
import DetalleExcusaModal from '../components/excusas/DetalleExcusaModal';
import {
  CalendarCheck2,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isCoordinador, isDocente } = useAuth();
  
  // HU-04: Por defecto filtra las novedades del día (CURDATE())
  const {
    excusas,
    loading,
    filters,
    updateFilters,
    resetFilters,
    refetch
  } = useExcusas({ solo_hoy: 'true' });

  const [excusaSeleccionada, setExcusaSeleccionada] = useState(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const handleVerDetalle = (excusa) => {
    setExcusaSeleccionada(excusa);
    setModalDetalleOpen(true);
  };

  const handleExportCsv = async () => {
    try {
      await api.exportarCsv(filters);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado del Dashboard Administrativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-blue-900" />
            Novedades y Consulta Diaria de Excusas (HU-04)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Portal administrativo institucional • {isCoordinador ? 'Vista de Coordinación' : 'Vista Docente'}
          </p>
        </div>

        {/* Badge Institucional */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            Vigencia Activa: <strong>2026</strong>
          </span>
        </div>
      </div>

      {/* Barra de Filtros Avanzados (HU-04) y Exportación CSV (HU-07) */}
      <AdvancedFilterBar
        filters={filters}
        onFilterChange={updateFilters}
        onResetFilters={() => resetFilters({ solo_hoy: 'true' })}
        onExportCsv={isCoordinador ? handleExportCsv : null}
        totalResultados={excusas.length}
      />

      {/* Tabla de Resultados */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          Consultando registros de excusas...
        </div>
      ) : (
        <TablaExcusas
          excusas={excusas}
          showEstudianteCol={true}
          onVerDetalle={handleVerDetalle}
          onRegistrarSeguimiento={handleVerDetalle}
        />
      )}

      {/* Modal de Detalle y Seguimiento (HU-06 y HU-09) */}
      <DetalleExcusaModal
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        excusaId={excusaSeleccionada?.id}
        onActualizado={refetch}
      />

    </div>
  );
}
