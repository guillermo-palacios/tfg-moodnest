import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const { logout } = useContext(AuthContext);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-indigo-600 mb-4">¡Bienvenido a MoodNest!</h1>
      <p className="text-gray-600 mb-8">Has iniciado sesión correctamente. Aquí construiremos tu panel de registros.</p>
      <button 
        onClick={logout} 
        className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600"
      >
        Cerrar Sesión
      </button>
    </div>
  );
}