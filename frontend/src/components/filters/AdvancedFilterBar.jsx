import { useState } from 'react';
import { useCatalogos } from '../../hooks/useCatalogos';
import { useAuth } from '../../hooks/useAuth';
import {
  Calendar,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function AdvancedFilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  onExportCsv,
  totalResultados = 0
}) {
  const { cursos, motivos } = useCatalogos();
  const { isCoordinador } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);

  // Calcular número de filtros activos distintos de los valores por defecto
  const filtrosActivos = [
    filters.estudiante,
    filters.id_curso,
    filters.motivo,
    filters.es_indefinida,
    filters.fecha_desde,
    filters.fecha_hasta
  ].filter(v => v !== undefined && v !== '').length;

  const handleInputChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const handleToggleSoloHoy = () => {
    const nextVal = filters.solo_hoy === 'true' ? 'false' : 'true';
    onFilterChange({ solo_hoy: nextVal });
  };

  const handleExport = async () => {
    if (!onExportCsv) return;
    setExporting(true);
    try {
      await onExportCsv();
    } catch (err) {
      alert(err.message || 'Error al exportar reporte.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
      
      {/* Barra superior: Título, Filtro Hoy y Exportar CSV (HU-07) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 sm:pb-4">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-900 shrink-0" />
            <h3 className="text-sm font-bold text-slate-800">
              Filtros Avanzados
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
              {totalResultados}
            </span>
          </div>

          {/* Botón toggle de filtros para móviles (< md) */}
          <button
            type="button"
            onClick={() => setFiltrosVisibles(prev => !prev)}
            className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-900" />
            <span>Filtros</span>
            {filtrosActivos > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-900 text-white text-[10px] flex items-center justify-center font-bold">
                {filtrosActivos}
              </span>
            )}
            {filtrosVisibles ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Acciones principales: Novedades de hoy, CSV y Reset */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Botón Novedades de Hoy (HU-04) */}
          <button
            onClick={handleToggleSoloHoy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filters.solo_hoy === 'true'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Novedades del Día</span>
          </button>

          {/* HU-07: Exportación CSV ÚNICAMENTE para Coordinador (id_rol = 1) */}
          {isCoordinador && (
            <button
              onClick={handleExport}
              disabled={exporting}
              title="Descargar reporte consolidado en Excel/CSV según los filtros activos"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>{exporting ? 'Exportando...' : 'Exportar CSV'}</span>
            </button>
          )}

          {/* Reset */}
          <button
            onClick={onResetFilters}
            title="Restablecer todos los filtros"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 sm:border-transparent"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Cuadrícula de Controles de Filtro (Siempre visible en md+, colapsable en móviles) */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs transition-all ${
          filtrosVisibles ? 'grid' : 'hidden md:grid'
        }`}
      >
        
        {/* Búsqueda por Estudiante */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Estudiante (Nombre o Doc)
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={filters.estudiante || ''}
              onChange={(e) => handleInputChange('estudiante', e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Curso / Grado */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Curso / Grado
          </label>
          <select
            value={filters.id_curso || ''}
            onChange={(e) => handleInputChange('id_curso', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          >
            <option value="">Todos los grados (1A a 11B)</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>Grado {c.grado}</option>
            ))}
          </select>
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Motivo de Inasistencia
          </label>
          <select
            value={filters.motivo || ''}
            onChange={(e) => handleInputChange('motivo', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          >
            <option value="">Todos los motivos</option>
            {motivos.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        {/* Modalidad */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Modalidad de Excusa
          </label>
          <select
            value={filters.es_indefinida !== undefined ? filters.es_indefinida : ''}
            onChange={(e) => handleInputChange('es_indefinida', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          >
            <option value="">Todas las modalidades</option>
            <option value="false">Definidas (Con fecha límite)</option>
            <option value="true">Indefinidas (Médicas / Prolongadas)</option>
          </select>
        </div>

        {/* Rango de Fechas (Desde / Hasta) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Rango Fecha Desde
          </label>
          <input
            type="date"
            value={filters.fecha_desde || ''}
            onChange={(e) => handleInputChange('fecha_desde', e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Rango Fecha Hasta
          </label>
          <input
            type="date"
            value={filters.fecha_hasta || ''}
            onChange={(e) => handleInputChange('fecha_hasta', e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
          />
        </div>

      </div>

    </div>
  );
}
