import { Link } from 'react-router-dom';

export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Navbar Pública */}
      <nav className="flex items-center justify-between bg-white px-6 py-4 shadow-sm border-b">
        <Link to="/" className="text-2xl font-extrabold text-indigo-600">MoodNest</Link>
        <div className="space-x-4">
          <Link to="/login" className="font-medium text-gray-600 hover:text-indigo-600">Entrar</Link>
          <Link to="/register" className="rounded-full bg-indigo-600 px-5 py-2 font-medium text-white transition hover:bg-indigo-700">
            Empezar
          </Link>
        </div>
      </nav>

      {/* Contenido Dinámico (Cargará el Login, el Registro o el Welcome) */}
      <main className="flex flex-1 flex-col items-center justify-center p-6">
        {children}
      </main>

      {/* Footer Público */}
      <footer className="bg-white py-6 text-center text-sm text-gray-500 border-t mt-auto">
        <p>&copy; {new Date().getFullYear()} MoodNest - Trabajo Fin de Grado</p>
        <p className="mt-1">Desarrollado por Guillermo Palacios</p>
      </footer>
    </div>
  );
}