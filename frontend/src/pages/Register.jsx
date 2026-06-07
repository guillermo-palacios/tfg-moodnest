import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Página de registro de nuevos usuarios.
 * Recopila los datos básicos y crea una nueva cuenta mediante el AuthContext.
 */
export default function Register() {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { registerUser } = useContext(AuthContext);
    const navigate = useNavigate();

    /**
     * Maneja la creación de cuenta.
     * En caso de éxito, el usuario es autenticado automáticamente (token generado en el backend).
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await registerUser(nombre, email, password);
            toast.success('¡Bienvenido a MoodNest!');
            navigate('/dashboard'); 
        } catch (err) {
            toast.error('Error al crear la cuenta. Puede que el email ya exista.');
        }
    };

    return (
        <div className="w-full max-w-md rounded-3xl bg-surface p-8 shadow-md border border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="flex justify-center mb-6">
                <img src="/logo-indigo.png" alt="MoodNest" className="h-20 w-auto object-contain drop-shadow-md" />
            </div>
            
            <h2 className="mb-6 text-center text-3xl font-bold text-main">Crear Cuenta</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-main/80 mb-1">Nombre</label>
                    <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} 
                           className="w-full rounded-xl border border-gray-300 bg-canvas p-3 text-main focus:ring-1 focus:ring-primary transition-colors" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-main/80 mb-1">Email</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                           className="w-full rounded-xl border border-gray-300 bg-canvas p-3 text-main focus:ring-1 focus:ring-primary transition-colors" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-main/80 mb-1">Contraseña</label>
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                           className="w-full rounded-xl border border-gray-300 bg-canvas p-3 text-main focus:ring-1 focus:ring-primary transition-colors" />
                </div>

                <button type="submit" className="mt-2 w-full rounded-xl bg-primary py-3 font-bold text-white shadow-md transition hover:opacity-90">
                    Registrarse
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-main/60">
                ¿Ya tienes una cuenta? <Link to="/login" className="font-bold text-primary hover:underline">Inicia sesión</Link>
            </p>
        </div>
    );
}