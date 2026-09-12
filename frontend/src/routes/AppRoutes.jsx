import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/common/Layout';

import LoginPage from '../pages/LoginPage';
import EstudianteDashboard from '../pages/EstudianteDashboard';
import RadicarExcusaPage from '../pages/RadicarExcusaPage';
import ExcusasAbiertasPage from '../pages/ExcusasAbiertasPage';
import AdminDashboard from '../pages/AdminDashboard';
import HistorialEstudiantePage from '../pages/HistorialEstudiantePage';

export default function AppRoutes() {
  const { isAuthenticated, isEstudiante } = useAuth();

  return (
    <Routes>
      {/* Ruta pública de Login */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={isEstudiante ? '/portal/mis-excusas' : '/admin/novedades'} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Rutas para Estudiantes / Acudientes (Rol 3) */}
      <Route
        path="/portal/mis-excusas"
        element={
          <ProtectedRoute allowedRoles={[3]}>
            <Layout>
              <EstudianteDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/portal/radicar"
        element={
          <ProtectedRoute allowedRoles={[3]}>
            <Layout>
              <RadicarExcusaPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/portal/abiertas"
        element={
          <ProtectedRoute allowedRoles={[3]}>
            <Layout>
              <ExcusasAbiertasPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/portal/historial"
        element={
          <ProtectedRoute allowedRoles={[3]}>
            <Layout>
              <HistorialEstudiantePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Rutas para Personal Administrativo (Coordinador Rol 1 y Docente Rol 2) */}
      <Route
        path="/admin/novedades"
        element={
          <ProtectedRoute allowedRoles={[1, 2]}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/estudiantes"
        element={
          <ProtectedRoute allowedRoles={[1, 2]}>
            <Layout>
              <HistorialEstudiantePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Redirección por defecto */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated
                ? isEstudiante
                  ? '/portal/mis-excusas'
                  : '/admin/novedades'
                : '/login'
            }
            replace
          />
        }
      />
    </Routes>
  );
}
