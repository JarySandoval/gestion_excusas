import { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../api/client';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initAuth() {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
          // Opcional: refrescar perfil en segundo plano
          api.getProfile().then(data => {
            if (data.success && data.user) {
              setUser(data.user);
              localStorage.setItem('user', JSON.stringify(data.user));
            }
          }).catch(() => {
            // Si el token falló, limpiar
            logout();
          });
        } catch {
          logout();
        }
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const login = async (usuario, contrasena) => {
    setError(null);
    try {
      const data = await api.login(usuario, contrasena);
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user, portal: data.portal };
      }
      throw new Error(data.message || 'Error en el inicio de sesión.');
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const isCoordinador = user?.id_rol === 1;
  const isDocente = user?.id_rol === 2;
  const isStaff = user?.id_rol === 1 || user?.id_rol === 2;
  const isEstudiante = user?.id_rol === 3;

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    isCoordinador,
    isDocente,
    isStaff,
    isEstudiante
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
