import { Link } from 'react-router-dom';

export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-main transition-colors duration-300">
      
      {/* Navbar Pública */}
      <nav className="flex items-center justify-between bg-surface px-6 py-4 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        
        {/* LOGO Y NOMBRE */}
        <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <img 
            src="/logo-indigo.png" 
            alt="Logo MoodNest" 
            className="h-8 w-auto object-contain drop-shadow-sm" 
          />
          <span className="text-2xl font-extrabold text-primary">MoodNest</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/login" className="font-medium text-main/70 hover:text-primary transition-colors">
            Entrar
          </Link>
          <Link to="/register" className="rounded-full bg-primary px-5 py-2 font-medium text-white shadow-sm transition hover:opacity-90">
            Empezar
          </Link>
        </div>
      </nav>

      {/* Contenido Dinámico (Login, Register o Welcome) */}
      <main className="flex flex-1 flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        {children}
      </main>

      {/* Footer Público */}
      <footer className="bg-surface py-6 text-center text-sm text-main/50 border-t border-gray-200 dark:border-gray-800 mt-auto transition-colors duration-300">
        <p>&copy; {new Date().getFullYear()} MoodNest - Trabajo Fin de Grado</p>
        <p className="mt-1 font-medium text-main/70">Desarrollado por Guillermo Palacios</p>
      </footer>
    </div>
  );
}