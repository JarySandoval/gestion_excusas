import { useAuth } from '../../hooks/useAuth';
import { School, LogOut, User, ShieldCheck, BookOpen, Menu, X } from 'lucide-react';

export default function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout, isCoordinador, isDocente, isEstudiante } = useAuth();

  const getRolBadge = (isCompact = false) => {
    if (isCoordinador) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200"
          title="Coordinador(a)"
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className={isCompact ? "hidden md:inline" : ""}>Coordinación</span>
        </span>
      );
    }
    if (isDocente) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"
          title="Docente"
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span className={isCompact ? "hidden md:inline" : ""}>Docente</span>
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
        title="Estudiante"
      >
        <User className="w-3.5 h-3.5 shrink-0" />
        <span className={isCompact ? "hidden md:inline" : ""}>Estudiante</span>
      </span>
    );
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Lado izquierdo: Botón Hamburguesa Móvil + Institución */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Botón Drawer Hamburguesa en Móvil y Tablet (< lg) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer shrink-0"
            aria-label={isSidebarOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <School className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                IED La Victoria
              </h1>
              <span className="text-[10px] sm:text-[11px] bg-slate-100 text-slate-600 font-medium px-1.5 sm:px-2 py-0.5 rounded shrink-0">
                2026
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block truncate">
              Módulo de Radicación y Seguimiento de Excusas Escolares
            </p>
            <p className="text-[10px] text-slate-500 font-medium sm:hidden truncate">
              Excusas Escolares
            </p>
          </div>
        </div>

        {/* Info de usuario y acciones */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Badge compacto en pantallas pequeñas */}
          <div className="sm:hidden">
            {getRolBadge(true)}
          </div>

          {/* Ficha completa de usuario en pantallas medianas y grandes */}
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm font-semibold text-slate-800 max-w-[140px] md:max-w-[220px] truncate">
                {user?.nombre} {user?.apellido}
              </span>
              {getRolBadge(false)}
            </div>
            <div className="text-xs text-slate-500 flex items-center justify-end gap-2">
              <span>Doc: {user?.identificacion}</span>
              {user?.curso && (
                <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                  Grado {user.curso.grado}
                </span>
              )}
            </div>
          </div>

          {/* Botón Salir */}
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 text-xs font-medium text-slate-700 hover:text-red-700 hover:bg-red-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Cerrar Sesión</span>
          </button>
        </div>

      </div>
    </header>
  );
}
