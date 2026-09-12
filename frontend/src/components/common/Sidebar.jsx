import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  FileText,
  PlusCircle,
  Clock,
  History,
  CalendarCheck2,
  Users,
  ShieldAlert
} from 'lucide-react';

export default function Sidebar() {
  const { isEstudiante, isStaff, isCoordinador } = useAuth();

  const activeClass = "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm bg-blue-900 text-white shadow-xs transition-all";
  const inactiveClass = "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition-all";

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        
        {/* Menú Estudiante / Acudiente */}
        {isEstudiante && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
              Portal Estudiantil
            </span>
            <nav className="mt-2 space-y-1">
              <NavLink to="/portal/mis-excusas" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
                <FileText className="w-4 h-4" />
                <span>Mis Excusas</span>
              </NavLink>

              <NavLink to="/portal/radicar" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
                <PlusCircle className="w-4 h-4" />
                <span>Radicar Excusa</span>
              </NavLink>

              <NavLink to="/portal/abiertas" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
                <Clock className="w-4 h-4" />
                <span>Excusas Abiertas (HU-08)</span>
              </NavLink>

              <NavLink to="/portal/historial" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
                <History className="w-4 h-4" />
                <span>Línea de Tiempo</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* Menú Personal Administrativo (Docentes y Coordinación) */}
        {isStaff && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
              Gestión Institucional
            </span>
            <nav className="mt-2 space-y-1">
              <NavLink to="/admin/novedades" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
                <CalendarCheck2 className="w-4 h-4" />
                <span>Novedades del Día (HU-04)</span>
              </NavLink>

              <NavLink to="/admin/estudiantes" className={({ isActive }) => isActive ? activeClass : inactiveClass}>
                <Users className="w-4 h-4" />
                <span>Línea de Tiempo (HU-05)</span>
              </NavLink>
            </nav>
          </div>
        )}

      </div>

      {/* Tarjeta Informativa Institucional */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <strong className="block text-slate-800">Regla Institucional:</strong>
            Las excusas no requieren aprobación; su registro es formal y el cierre de casos indefinidos exige soporte médico de alta.
          </div>
        </div>
      </div>
    </aside>
  );
}
