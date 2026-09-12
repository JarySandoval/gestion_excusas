import { useAuth } from '../../hooks/useAuth';
import { School, LogOut, User, ShieldCheck, BookOpen, AlertCircle } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isCoordinador, isDocente, isEstudiante } = useAuth();

  const getRolBadge = () => {
    if (isCoordinador) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          <ShieldCheck className="w-3.5 h-3.5" /> Coordinador(a)
        </span>
      );
    }
    if (isDocente) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <BookOpen className="w-3.5 h-3.5" /> Docente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <User className="w-3.5 h-3.5" /> Estudiante
      </span>
    );
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Institución & Módulo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold shadow-sm">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                IED La Victoria
              </h1>
              <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
                Vigencia 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Módulo de Radicación y Seguimiento de Excusas Escolares
            </p>
          </div>
        </div>

        {/* Info de usuario y acciones */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm font-semibold text-slate-800">
                {user?.nombre} {user?.apellido}
              </span>
              {getRolBadge()}
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-red-700 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
