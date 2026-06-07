import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Contexto global para la autenticación y preferencias visuales del usuario.
 */
export const AuthContext = createContext();

/** Mapa de colores para la inyección dinámica de variables CSS (Tailwind). */
const DICCIONARIO_COLORES = {
  indigo: '91 97 196',
  emerald: '16 185 129',
  rose: '244 63 94',
  amber: '245 158 11',
  blue: '59 130 246',
};

/**
 * Proveedor de autenticación que envuelve la aplicación.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [temaColor, setTemaColor] = useState('indigo');

  /**
   * Aplica las preferencias de interfaz de usuario mediante manipulación directa del DOM.
   * Modifica clases globales (tema oscuro) y variables CSS (colores primarios).
   */
  const aplicarPreferenciasVisuales = (preferencias) => {
    const html = document.documentElement;

    // Toggle de clase oscura basado en preferencias
    if (preferencias?.tema === 'oscuro') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    const colorNombre = preferencias?.colorPrincipal || 'indigo';
    setTemaColor(colorNombre);

    // Inyección de variables CSS para Tailwind 
    const rgb = DICCIONARIO_COLORES[colorNombre] || DICCIONARIO_COLORES['indigo'];
    html.style.setProperty('--color-primary', rgb);
  };

  /**
   * Efecto de inicialización: Recupera la sesión al refrescar el navegador.
   * Si el token es inválido, limpia el estado para asegurar la seguridad.
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          setUser({ token });
          const res = await api.get('/usuario/me');
          aplicarPreferenciasVisuales(res.data.preferenciasSistema);
        } catch (error) {
          console.warn("Token inválido o expirado. Limpiando sesión...");
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false); // Finaliza la carga inicial independientemente del resultado
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;

      localStorage.setItem('token', token);
      setUser({ token });

      const resUser = await api.get('/usuario/me');
      aplicarPreferenciasVisuales(resUser.data.preferenciasSistema);

      return true;
    } catch (error) {
      throw error;
    }
  };

  const registerUser = async (nombre, email, password) => {
    try {
      const response = await api.post('/auth/register', { nombre, email, password });
      const { token } = response.data;

      localStorage.setItem('token', token);
      setUser({ token });

      aplicarPreferenciasVisuales({ tema: 'claro', colorPrincipal: 'indigo' });
      return true;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    aplicarPreferenciasVisuales({ tema: 'claro', colorPrincipal: 'indigo' });
  };

  return (
    <AuthContext.Provider value={{ user, login, registerUser, logout, loading, aplicarPreferenciasVisuales, temaColor }}>
      {children}
    </AuthContext.Provider>
  );
};