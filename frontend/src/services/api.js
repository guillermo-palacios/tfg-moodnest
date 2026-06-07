import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Instancia configurada de Axios para peticiones a la API.
 * Define el timeout global para cumplir con el RNF de Disponibilidad.
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json', 
  },
});

/**
 * Interceptor de peticiones: Adjunta el JWT automáticamente en la cabecera 'Authorization'.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Interceptor de respuestas: Gestiona errores globales de red y expiración de sesión.
 */
api.interceptors.response.use(
  (response) => response, 
  (error) => {
    // CASO A: Fallo de conexión o Timeout del backend 
    if (error.code === 'ECONNABORTED' || !error.response) {
      toast.error('Error de conexión: El servidor no responde. Inténtalo de nuevo.', {
        id: 'error-conexion-global',
        duration: 5000
      });
      return Promise.reject(error);
    }

    // CASO B: El token ha caducado (401) o acceso denegado (403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Ignoramos el error si estamos en el proceso de login
      if (!error.config.url.includes('/auth/login')) {
        toast.error('La sesión ha expirado. Redirigiendo...');
        localStorage.removeItem('token');
        window.location.href = '/login'; 
      }
    }

    return Promise.reject(error);
  }
);

export default api;