import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Layout({ children }) {
  const { logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    )},
    { name: 'Calendario', path: '/historial', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    )},
    { name: 'Estadísticas', path: '/estadisticas', icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    )}
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-16 md:pb-0">
      
      {/* 1. BARRA SUPERIOR PRINCIPAL (Morada) */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-indigo-600 px-6 py-4 shadow-md">
        <div className="text-2xl font-extrabold tracking-wide text-white">MoodNest</div>
        <button onClick={logout} className="text-sm font-medium text-indigo-100 transition hover:text-white">
          Cerrar Sesión
        </button>
      </header>

      {/* 2. SUBMENÚ DESKTOP (Blanco, debajo de la morada) */}
      <nav className="hidden border-b bg-white shadow-sm md:block">
        <div className="mx-auto flex max-w-4xl justify-center space-x-12 px-4">
          {navItems.map((item) => (
            <Link key={item.name} to={item.path} 
              className={`flex items-center space-x-2 border-b-2 px-2 py-4 font-medium transition-colors ${
                isActive(item.path) 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
              }`}>
              {item.icon}
              <span className="text-base">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* 3. CONTENIDO DE LA PÁGINA */}
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>

      {/* 4. MENÚ INFERIOR MÓVIL */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t bg-white pb-safe pt-2 shadow-lg md:hidden">
        {navItems.map((item) => (
          <Link key={item.name} to={item.path} 
            className={`flex flex-col items-center p-2 transition-colors ${
              isActive(item.path) ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {item.icon}
            <span className="mt-1 text-xs font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}