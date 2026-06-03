import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando sistema...</div>;
  
  // Si no hay usuario, lo redirigimos al login
  if (!user) return <Navigate to="/login" replace />;
  
  // Si hay usuario, le dejamos ver el componente hijo (ej. Dashboard)
  return children;
}