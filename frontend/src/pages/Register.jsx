import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { registerUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await registerUser(nombre, email, password);
            navigate('/dashboard'); // Redirige al panel principal tras registrarse
        } catch (err) {
            setError('Error al crear la cuenta. Puede que el email ya exista.');
        }
    };

    return (
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md border border-gray-100">
            <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">Crear Cuenta</h2>
            {error && <p className="mb-4 rounded bg-red-100 p-2 text-sm text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... (Tus inputs de Nombre, Email y Contraseña se quedan igual) ... */}
                <div><label className="block text-sm font-medium text-gray-700">Nombre</label><input type="text" required className="mt-1 w-full rounded border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" required className="mt-1 w-full rounded border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700">Contraseña</label><input type="password" required className="mt-1 w-full rounded border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={password} onChange={(e) => setPassword(e.target.value)} /></div>

                <button type="submit" className="w-full rounded bg-indigo-600 p-2 py-2 font-bold text-white transition hover:bg-indigo-700">Registrarse</button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                ¿Ya tienes una cuenta? <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Inicia sesión</Link>
            </p>
        </div>
    );
}