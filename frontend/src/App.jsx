import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Historial from './pages/Historial';
import Perfil from './pages/Perfil';

const NuevoRegistroTemp = () => <div className="p-8 text-center text-gray-500">Formulario en construcción...</div>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<PublicLayout><Welcome /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
          
          {/* ... (Tus rutas privadas se quedan igual) ... */}
          
          {/* Rutas Protegidas (Envueltas en el Layout) */}
          <Route element={
            <ProtectedRoute>
              <Layout>
                {/* IMPORTANTE: Outlet se usa de otra forma, aquí pasamos children, así que Layout envuelve las rutas */}
              </Layout>
            </ProtectedRoute>
          }>
            {/* Como estamos usando Layout con children en v6, lo estructuramos así: */}
          </Route>

          {/* ESTA ES LA ESTRUCTURA CORRECTA EN REACT ROUTER V6 */}
          <Route path="/perfil" element={<ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/historial" element={<ProtectedRoute><Layout><Historial /></Layout></ProtectedRoute>} />
          <Route path="/estadisticas" element={<ProtectedRoute><Layout><div className="text-center text-gray-500 mt-10">Estadísticas en construcción...</div></Layout></ProtectedRoute>} />

          {/* Redirección para URLs inválidas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}