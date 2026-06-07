import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';

// Páginas
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Historial from './pages/Historial';
import Perfil from './pages/Perfil';
import Estadisticas from './pages/Estadisticas';

/**
 * Componente raíz: Configura el proveedor de autenticación, 
 * el sistema de notificaciones y la jerarquía de rutas.
 */
export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
          className: 'nitido-toast'
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas: Layout diseñado para landings y formularios */}
          <Route element={<PublicLayout><Welcome /></PublicLayout>} path="/" />
          <Route element={<PublicLayout><Login /></PublicLayout>} path="/login" />
          <Route element={<PublicLayout><Register /></PublicLayout>} path="/register" />

          {/* Rutas Protegidas: Envueltas en ProtectedRoute y Layout privativo */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/historial" element={<ProtectedRoute><Layout><Historial /></Layout></ProtectedRoute>} />
          <Route path="/estadisticas" element={<ProtectedRoute><Layout><Estadisticas /></Layout></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><Layout><Perfil /></Layout></ProtectedRoute>} />

          {/* Catch-all: Redirección de seguridad para URLs no definidas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}