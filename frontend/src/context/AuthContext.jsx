import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

// Creamos el contexto
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, comprobamos si ya había un token guardado de ayer
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ token });
    }
    setLoading(false);
  }, []);

  // Función para hacer Login
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data; // Tu backend devuelve { "token": "eyJhb..." }
      
      localStorage.setItem('token', token);
      setUser({ token });
      return true;
    } catch (error) {
      console.error("Error en login:", error.response?.data);
      throw error;
    }
  };

  // Función para Registrarse
  const registerUser = async (nombre, email, password) => {
    try {
      // Llamamos al endpoint de registro que creaste en Java
      const response = await api.post('/auth/register', { nombre, email, password });
      const { token } = response.data; 
      
      // Guardamos el token y logueamos al usuario automáticamente
      localStorage.setItem('token', token);
      setUser({ token });
      return true;
    } catch (error) {
      console.error("Error en registro:", error.response?.data);
      throw error;
    }
  };

  // Función para hacer Logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, registerUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};