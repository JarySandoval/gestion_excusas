import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Cerrar el drawer móvil automáticamente en cada navegación
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        isSidebarOpen={sidebarOpen}
      />
      <div className="flex-1 flex relative">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
