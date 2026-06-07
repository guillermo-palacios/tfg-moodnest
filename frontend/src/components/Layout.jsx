import { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Layout privado principal. Envuelve todas las páginas protegidas del Dashboard.
 * Gestiona la navegación (Desktop/Mobile), el cambio de tema y la sesión de usuario.
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Contenido de la página a renderizar.
 */
export default function Layout({ children }) {
  const { logout, temaColor } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const isActive = (path) => location.pathname === path;

  const navItems = [
    {
      name: 'Dashboard', path: '/dashboard', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      )
    },
    {
      name: 'Calendario', path: '/historial', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      )
    },
    {
      name: 'Estadísticas', path: '/estadisticas', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        )
    }
  ];

  /**
   * Ejecuta el cierre de sesión y redirige al usuario al inicio.
   */
  const handleConfirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    toast.success('Sesión cerrada correctamente');
    navigate('/'); 
  };

  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">

      {/* HEADER: Contiene branding y acceso al perfil */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-primary px-6 py-4 shadow-md transition-colors duration-300">
      <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
            {/* Carga dinámica del logo según el color configurado en el perfil */}
            <img 
                src={`/logo-${temaColor}.png`} 
                alt="Logo MoodNest" 
                className="h-7 w-auto object-contain"
                onError={(e) => e.target.src = '/logo-indigo.png'} // Fallback por si la imagen no existe
            />
          </div>
          <span className="text-2xl font-extrabold tracking-wide text-white">MoodNest</span>
        </Link>
        
        <div className="flex items-center space-x-5">
          <Link
            to="/perfil"
            className={`rounded-full p-1.5 transition-colors ${isActive('/perfil') ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            title="Mi Perfil"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>

          <button onClick={() => setIsLogoutModalOpen(true)} className="text-white hover:text-gray-200 font-bold">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* SUBMENÚ DESKTOP: Navegación horizontal para pantallas grandes */}
      <nav className="hidden border-b border-gray-200 dark:border-gray-800 bg-surface shadow-sm md:block transition-colors duration-300">
        <div className="mx-auto flex max-w-4xl justify-center space-x-12 px-4">
          {navItems.map((item) => (
            <Link key={item.name} to={item.path}
              className={`flex items-center space-x-2 border-b-2 px-2 py-4 font-medium transition-colors ${isActive(item.path)
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-main'
                }`}>
              {item.icon}
              <span className="text-base">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* CONTENIDO DE LA PÁGINA */}
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>

      {/* MENÚ INFERIOR MÓVIL: Navegación fija ergonómica para dispositivos táctiles */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-gray-200 dark:border-gray-800 bg-surface pb-safe pt-2 shadow-lg md:hidden transition-colors duration-300">
        {navItems.map((item) => (
          <Link key={item.name} to={item.path}
            className={`flex flex-col items-center p-2 transition-colors ${isActive(item.path) ? 'text-primary' : 'text-gray-400 hover:text-main'
              }`}>
            {item.icon}
            <span className="mt-1 text-xs font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* MODAL DE CIERRE DE SESIÓN: Flujo de confirmación para evitar cierres accidentales */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-main mb-2">¿Cerrar Sesión?</h3>
            <p className="text-main/70 mb-6 text-sm">
              Tendrás que volver a introducir tus credenciales la próxima vez que quieras acceder.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setIsLogoutModalOpen(false)} // Flujo Alternativo 1: Cancelar
                className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 font-semibold text-main hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmLogout} // Flujo Principal: Confirmar
                className="flex-1 rounded-xl bg-red-500 py-3 font-semibold text-white hover:bg-red-600 shadow-md transition"
              >
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}