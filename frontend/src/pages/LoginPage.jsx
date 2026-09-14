import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { School, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(usuario, contrasena);
      if (res.success) {
        if (res.portal === 'estudiante') {
          navigate('/portal/mis-excusas');
        } else {
          navigate('/admin/novedades');
        }
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  // Ayudante para autocompletar credenciales de prueba
  const llenarCredenciales = (u, c) => {
    setUsuario(u);
    setContrasena(c);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-950 via-slate-900 to-blue-900 flex flex-col justify-center items-center p-3.5 sm:p-4">
      
      {/* Contenedor Principal */}
      <div className="max-w-md w-full">
        
        {/* Cabecera Institucional */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <School className="w-8 h-8 sm:w-9 sm:h-9 text-blue-300" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            IED La Victoria
          </h1>
          <p className="text-xs text-blue-200 font-medium mt-1">
            Sistema de Radicación y Seguimiento de Excusas Escolares
          </p>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-8 space-y-5 sm:space-y-6">
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Autenticación Institucional (HU-01)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ingrese con sus credenciales institucionales asignadas
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-tight">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo Usuario */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Usuario Institucional
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="[inicial nombre][apellido][número] (ej. jperez1)"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Estructura: Inicial primer nombre + primer apellido + número.
              </span>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Número de documento de identidad"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Por defecto corresponde a su número de identificación.
              </span>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Verificando credenciales...</span>
              ) : (
                <>
                  <span>Ingresar al Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Accesos Rápidos de Prueba (Demo Conveniente) */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Credenciales de Prueba (Atajos Rápidos):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-[11px]">
              <button
                type="button"
                onClick={() => llenarCredenciales('mrodriguez1', '51987456')}
                className="p-2.5 sm:p-2 text-center rounded-xl sm:rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold border border-purple-200 transition-colors cursor-pointer"
              >
                Coordinador
              </button>
              <button
                type="button"
                onClick={() => llenarCredenciales('cgomez1', '79654123')}
                className="p-2.5 sm:p-2 text-center rounded-xl sm:rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold border border-blue-200 transition-colors cursor-pointer"
              >
                Docente
              </button>
              <button
                type="button"
                onClick={() => llenarCredenciales('jperez1', '1012345678')}
                className="p-2.5 sm:p-2 text-center rounded-xl sm:rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold border border-emerald-200 transition-colors cursor-pointer"
              >
                Estudiante
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-blue-300/80">
          Institución Educativa Distrital La Victoria • Vigencia Activa 2026
        </div>

      </div>

    </div>
  );
}
