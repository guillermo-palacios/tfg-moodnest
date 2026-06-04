import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

// Un diccionario que traduce el nombre del color elegido a su valor RGB real
const DICCIONARIO_COLORES = {
  indigo: '91 97 196',  // #5B61C4
  emerald: '16 185 129', // #10B981
  rose: '244 63 94',     // #F43F5E
  amber: '245 158 11',    // #F59E0B
  blue: '59 130 246',    // #3B82F6
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [temaColor, setTemaColor] = useState('indigo');

  // Función mágica que inyecta el Tema y el Color en el HTML
  const aplicarPreferenciasVisuales = (preferencias) => {
    const html = document.documentElement;

    // 1. Aplicamos el Modo Claro/Oscuro
    if (preferencias?.tema === 'oscuro') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // 2. Aplicamos el Color Principal
    const colorNombre = preferencias?.colorPrincipal || 'indigo';
    setTemaColor(colorNombre);

    const rgb = DICCIONARIO_COLORES[colorNombre] || DICCIONARIO_COLORES['indigo'];
    html.style.setProperty('--color-primary', rgb);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setUser({ token });
        try {
          // Si hay token, nos descargamos su perfil para pintar la app de su color
          const res = await api.get('/usuario/me');
          aplicarPreferenciasVisuales(res.data.preferenciasSistema);
        } catch (error) {
          throw error;
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;

      localStorage.setItem('token', token);
      setUser({ token });

      // Al hacer login, forzamos la descarga de sus colores
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

      // Por defecto, lo ponemos en modo claro y color indigo
      aplicarPreferenciasVisuales({ tema: 'claro', colorPrincipal: 'indigo' });
      return true;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Devolvemos la app a su estado original al cerrar sesión
    aplicarPreferenciasVisuales({ tema: 'claro', colorPrincipal: 'indigo' });
  };

  // Exponemos la función aplicarPreferenciasVisuales para que Perfil.jsx pueda usarla
  return (
    <AuthContext.Provider value={{ user, login, registerUser, logout, loading, aplicarPreferenciasVisuales, temaColor }}>
      {children}
    </AuthContext.Provider>
  );
};