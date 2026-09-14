import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  FileText,
  PlusCircle,
  Clock,
  History,
  CalendarCheck2,
  Users,
  ShieldAlert,
  X,
  User,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isEstudiante, isStaff, isCoordinador, isDocente } = useAuth();

  const activeClass = "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm bg-blue-900 text-white shadow-xs transition-all";
  const inactiveClass = "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:text-blue-900 hover:bg-blue-50 transition-all";

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Telón de fondo oscuro para móviles (< lg) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Contenedor del Sidebar / Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200
          p-4 flex flex-col justify-between shrink-0 shadow-2xl transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:w-64 lg:shadow-none lg:min-h-[calc(100vh-4rem)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="space-y-5 overflow-y-auto">
          
          {/* Cabecera Móvil del Drawer (< lg) */}
          <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {isCoordinador ? <ShieldCheck className="w-4 h-4" /> : isDocente ? <BookOpen className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {user?.nombre} {user?.apellido}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  Doc: {user?.identificacion} {user?.curso ? `• Grado ${user.curso.grado}` : ''}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menú Estudiante / Acudiente */}
          {isEstudiante && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                Portal Estudiantil
              </span>
              <nav className="mt-2 space-y-1">
                <NavLink
                  to="/portal/mis-excusas"
                  onClick={handleLinkClick}
                  className={({ isActive }) => isActive ? activeClass : inactiveClass}
                >
                  <FileText className="w-4 h-4" />
                  <span>Mis Excusas</span>
                </NavLink>

                <NavLink
                  to="/portal/radicar"
                  onClick={handleLinkClick}
                  className={({ isActive }) => isActive ? activeClass : inactiveClass}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Radicar Excusa</span>
                </NavLink>

                <NavLink
                  to="/portal/abiertas"
                  onClick={handleLinkClick}
                  className={({ isActive }) => isActive ? activeClass : inactiveClass}
                >
                  <Clock className="w-4 h-4" />
                  <span>Excusas Abiertas (HU-08)</span>
                </NavLink>

                <NavLink
                  to="/portal/historial"
                  onClick={handleLinkClick}
                  className={({ isActive }) => isActive ? activeClass : inactiveClass}
                >
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
                <NavLink
                  to="/admin/novedades"
                  onClick={handleLinkClick}
                  className={({ isActive }) => isActive ? activeClass : inactiveClass}
                >
                  <CalendarCheck2 className="w-4 h-4" />
                  <span>Novedades del Día (HU-04)</span>
                </NavLink>

                <NavLink
                  to="/admin/estudiantes"
                  onClick={handleLinkClick}
                  className={({ isActive }) => isActive ? activeClass : inactiveClass}
                >
                  <Users className="w-4 h-4" />
                  <span>Línea de Tiempo (HU-05)</span>
                </NavLink>
              </nav>
            </div>
          )}

        </div>

        {/* Tarjeta Informativa Institucional */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mt-4 shrink-0">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <strong className="block text-slate-800">Regla Institucional:</strong>
              Las excusas no requieren aprobación; su registro es formal y el cierre de casos indefinidos exige soporte médico de alta.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
