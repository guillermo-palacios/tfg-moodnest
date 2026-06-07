import { Link } from 'react-router-dom';

/**
 * Layout para páginas públicas (Landing, Login, Registro). 
 * Mantiene la identidad corporativa pero sin los elementos de navegación privada.
 * @param {Object} props 
 * @param {React.ReactNode} props.children - Formulario o contenido de la página.
 */
export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-main transition-colors duration-300">
      
      {/* NAVBAR PÚBLICA: Estilo corporativo simplificado */}
      <nav className="sticky top-0 z-50 flex items-center justify-between bg-primary px-6 py-4 shadow-md transition-colors duration-300">
        
        <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
            <img 
              src="/logo-indigo.png" 
              alt="Logo MoodNest" 
              className="h-7 w-auto object-contain" 
            />
          </div>
          <span className="text-2xl font-extrabold tracking-wide text-white">MoodNest</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/login" className="font-medium text-white/90 hover:text-white transition-colors">
            Iniciar Sesión
          </Link>
          <Link to="/register" className="rounded-full bg-white px-5 py-2 font-bold text-primary shadow-sm transition hover:opacity-90">
            Registrarse
          </Link>
        </div>
      </nav>

      <main className="flex flex-1 flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        {children}
      </main>

      {/* FOOTER PÚBLICO */}
      <footer className="bg-surface py-6 text-center text-sm text-main/50 border-t border-gray-200 dark:border-gray-800 mt-auto transition-colors duration-300">
        <p>&copy; {new Date().getFullYear()} MoodNest - Trabajo Fin de Grado</p>
        <p className="mt-1 font-medium text-main/70">Desarrollado por Guillermo Palacios</p>
      </footer>
    </div>
  );
}