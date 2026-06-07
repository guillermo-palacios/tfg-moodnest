import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Página de autenticación.
 * Gestiona el formulario de acceso, valida credenciales vía AuthContext y redirige al Dashboard.
 */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  /**
   * Maneja el envío del formulario de login.
   * Si las credenciales son válidas, redirige al usuario al panel de control principal.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      toast.success('¡Bienvenido de nuevo a MoodNest!');
      navigate('/dashboard'); 
    } catch (err) {
      // El error es manejado globalmente por el interceptor de Axios, 
      // pero este toast sirve como feedback visual inmediato.
      toast.error('Credenciales incorrectas. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl bg-surface p-8 shadow-md border border-gray-200 dark:border-gray-800 transition-colors duration-300">
      
      <div className="flex justify-center mb-6">
        <img src="/logo-indigo.png" alt="MoodNest" className="h-20 w-auto object-contain drop-shadow-md" />
      </div>
      
      <h2 className="mb-6 text-center text-3xl font-bold text-main">Iniciar Sesión</h2>
      
      {/* Visualización de errores de validación previa */}
      {error && <p className="mb-4 rounded-xl bg-red-100 p-3 text-sm text-red-600 font-medium text-center border border-red-200">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-main/80 mb-1">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                 className="w-full rounded-xl border border-gray-300 bg-canvas p-3 text-main focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-main/80 mb-1">Contraseña</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                 className="w-full rounded-xl border border-gray-300 bg-canvas p-3 text-main focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
        </div>
        <button type="submit" className="mt-2 w-full rounded-xl bg-primary py-3 font-bold text-white shadow-md transition hover:opacity-90">
            Entrar
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-main/60">
        ¿No tienes cuenta? <Link to="/register" className="font-bold text-primary hover:underline">Regístrate aquí</Link>
      </p>
    </div>
  );
}