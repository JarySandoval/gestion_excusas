import { Calendar, History, Clock, FileText, CheckCircle2, ChevronRight, School, User } from 'lucide-react';
import { ModalidadBadge } from '../common/Badge';

export default function StudentTimeline({
  estudiante,
  matriculas = [],
  timeline = [],
  onVerDetalle
}) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-700">Sin historial de excusas</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Este estudiante no registra solicitudes de excusa escolar en su historial acumulado.
        </p>
      </div>
    );
  }

  // Agrupar excusas por año lectivo
  const excusasPorAnio = timeline.reduce((acc, item) => {
    const anio = item.anio_lectivo || new Date(item.fecha_desde).getFullYear();
    if (!acc[anio]) acc[anio] = [];
    acc[anio].push(item);
    return acc;
  }, {});

  const anios = Object.keys(excusasPorAnio).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      
      {/* Tarjeta de Identificación del Estudiante */}
      {estudiante && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-black text-lg">
              {estudiante.nombre[0]}{estudiante.apellido[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {estudiante.nombre} {estudiante.apellido}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>Documento: <strong>{estudiante.identificacion}</strong></span>
                <span>•</span>
                <span>Usuario: <strong>{estudiante.usuario}</strong></span>
              </div>
            </div>
          </div>

          {/* Historial de Matrículas por Vigencia */}
          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Trayectoria Académica
            </span>
            <div className="flex flex-wrap gap-1.5">
              {matriculas.map((m) => (
                <span
                  key={m.id_vigencia}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                >
                  <School className="w-3 h-3 text-slate-500" />
                  {m.id_vigencia}: Grado {m.grado}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Línea de Tiempo Cronológica por Año Lectivo */}
      <div className="space-y-8">
        {anios.map((anio) => (
          <div key={anio} className="relative">
            
            {/* Header del Año */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center px-4 py-1.5 rounded-xl bg-blue-900 text-white font-bold text-sm shadow-xs">
                Año Lectivo {anio}
              </div>
              <div className="h-0.5 flex-1 bg-slate-200"></div>
              <span className="text-xs text-slate-500 font-semibold">
                {excusasPorAnio[anio].length} excusa(s) registrada(s)
              </span>
            </div>

            {/* Hitos del Timeline */}
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {excusasPorAnio[anio].map((item) => (
                <div key={item.id} className="relative group">
                  
                  {/* Nodo / Hito */}
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border-4 border-blue-900 shadow-xs flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-900"></div>
                  </div>

                  {/* Tarjeta de la Excusa */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-sm text-blue-900">
                          {item.radicado}
                        </span>
                        <ModalidadBadge
                          esIndefinida={Boolean(item.es_indefinida)}
                          fechaRetorno={item.fecha_retorno}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Grado Histórico: <strong>{item.curso_historico}</strong></span>
                        <span>•</span>
                        <span>{new Date(item.fecha_creacion).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block">Período de Inasistencia:</span>
                        <span className="font-bold text-slate-800">
                          {item.fecha_desde} al {item.fecha_hasta || (item.fecha_retorno ? `Retorno: ${item.fecha_retorno}` : 'Indefinida')}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold block">Motivo:</span>
                        <span className="font-bold text-blue-950">{item.motivo}</span>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-slate-400 font-semibold block">Soportes & Observaciones:</span>
                        <span className="font-medium text-slate-700">
                          {item.total_anexos} anexo(s) | {item.total_seguimientos} seguimiento(s)
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {item.descripcion}
                    </p>

                    {onVerDetalle && (
                      <div className="mt-3 pt-2 flex justify-end">
                        <button
                          onClick={() => onVerDetalle(item)}
                          className="flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-700"
                        >
                          <span>Ver detalle de la excusa</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                  </div>

                </div>
              ))}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
