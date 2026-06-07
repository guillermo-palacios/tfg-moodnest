import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Componente protector de rutas. Intercepta el acceso a rutas privadas y 
 * redirige a /login si no existe una sesión activa.
 * @param {Object} props 
 * @param {React.ReactNode} props.children - Página privada a la que se intenta acceder.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // Muestra un estado de carga mientras el AuthContext valida el token con el backend
  if (loading) return <div className="flex h-screen items-center justify-center">Cargando sistema...</div>;
  
  // Si no hay usuario, bloquea el paso y redirige a la vista pública
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
}