import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import StudentTimeline from '../components/timeline/StudentTimeline';
import DetalleExcusaModal from '../components/excusas/DetalleExcusaModal';
import { History, Search, Users, School } from 'lucide-react';

export default function HistorialEstudiantePage() {
  const { user, isEstudiante, isStaff } = useAuth();

  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(isEstudiante ? user?.id : '');
  const [busqueda, setBusqueda] = useState('');
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detalleId, setDetalleId] = useState(null);

  // Si es staff, cargar listado de estudiantes para selector
  useEffect(() => {
    if (isStaff) {
      api.getEstudiantes(busqueda)
        .then(data => {
          if (data.success) {
            setEstudiantes(data.estudiantes);
            if (!selectedStudentId && data.estudiantes.length > 0) {
              setSelectedStudentId(data.estudiantes[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [isStaff, busqueda]);

  // Cargar timeline del estudiante seleccionado
  useEffect(() => {
    const targetId = isEstudiante ? user?.id : selectedStudentId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    api.getTimelineEstudiante(targetId)
      .then(data => {
        if (data.success) {
          setTimelineData(data);
        } else {
          setError(data.message || 'Error al cargar historial.');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedStudentId, isEstudiante, user]);

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-blue-900" />
          Línea de Tiempo del Estudiante (HU-05)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Historial acumulado cronológico de inasistencias y excusas a través de las diferentes vigencias académicas
        </p>
      </div>

      {/* Selector de estudiante para Personal Docente y Coordinación */}
      {isStaff && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Seleccionar Estudiante para Inspección Cronológica:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por nombre o documento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
            >
              <option value="">-- Elija un estudiante ({estudiantes.length} encontrados) --</option>
              {estudiantes.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nombre} {est.apellido} (Doc: {est.identificacion} - Grado {est.grado || 'S/R'}) [{est.total_excusas} excusas]
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Visualización de Timeline */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          Cargando línea de tiempo acumulada...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
          {error}
        </div>
      ) : timelineData ? (
        <StudentTimeline
          estudiante={timelineData.estudiante}
          matriculas={timelineData.matriculas}
          timeline={timelineData.timeline}
          onVerDetalle={(excusa) => setDetalleId(excusa.id)}
        />
      ) : null}

      {/* Modal de Detalle */}
      <DetalleExcusaModal
        isOpen={!!detalleId}
        onClose={() => setDetalleId(null)}
        excusaId={detalleId}
      />

    </div>
  );
}
