import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard'); // Si va bien, al panel principal
    } catch (err) {
      setError('Credenciales incorrectas. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md border border-gray-100">
      <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">Iniciar Sesión</h2>
      {error && <p className="mb-4 rounded bg-red-100 p-2 text-sm text-red-600">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... (Tus inputs de Email y Contraseña se quedan igual) ... */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" required className="mt-1 w-full rounded border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contraseña</label>
          <input type="password" required className="mt-1 w-full rounded border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="w-full rounded bg-indigo-600 p-2 py-2 font-bold text-white transition hover:bg-indigo-700">Entrar</button>
      </form>
      
      <p className="mt-6 text-center text-sm text-gray-600">
        ¿No tienes cuenta? <Link to="/register" className="font-semibold text-indigo-600 hover:underline">Regístrate aquí</Link>
      </p>
    </div>
  );
}