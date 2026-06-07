import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

const DICCIONARIO_COLORES = {
  indigo: '91 97 196',
  emerald: '16 185 129',
  rose: '244 63 94',
  amber: '245 158 11',
  blue: '59 130 246',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [temaColor, setTemaColor] = useState('indigo');

  const aplicarPreferenciasVisuales = (preferencias) => {
    const html = document.documentElement;

    if (preferencias?.tema === 'oscuro') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    const colorNombre = preferencias?.colorPrincipal || 'indigo';
    setTemaColor(colorNombre);

    const rgb = DICCIONARIO_COLORES[colorNombre] || DICCIONARIO_COLORES['indigo'];
    html.style.setProperty('--color-primary', rgb);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          setUser({ token });
          const res = await api.get('/usuario/me');
          aplicarPreferenciasVisuales(res.data.preferenciasSistema);
        } catch (error) {
          // CORRECCIÓN: En lugar de hacer "throw error" y romper la app,
          // asumimos que el token es viejo/inválido y lo borramos.
          console.warn("Token inválido o base de datos reiniciada. Limpiando sesión...");
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      // CRÍTICO: Esto debe ejecutarse SIEMPRE, haya habido error o no.
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