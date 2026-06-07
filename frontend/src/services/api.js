import axios from 'axios';
import toast from 'react-hot-toast';


const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json', 
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Para controlar caídas de Base de Datos/Servidor
api.interceptors.response.use(
  (response) => response, // Si la respuesta va bien (200 OK), pasa de largo
  (error) => {
    // CASO A: El servidor no responde o la base de datos está caída (Timeout / Network Error)
    if (error.code === 'ECONNABORTED' || !error.response) {
      toast.error('Error de conexión: El servidor o la base de datos no responden. Reinténtalo en unos instantes.', {
        id: 'error-conexion-global', // Evita que se dupliquen mil toasts si fallan varias peticiones a la vez
        duration: 5000
      });
      return Promise.reject(error);
    }

    // CASO B: El token ha caducado o es inválido (Error 403 / 401)
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Si el error viene del login, no avisamos de token caducado (es simplemente credenciales mal)
      if (!error.config.url.includes('/auth/login')) {
        toast.error('La sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        localStorage.removeItem('token');
        window.location.href = '/login'; // Redirección limpia
      }
    }

    // Si el error es controlado, 
    // dejamos que el propio componente maneje su Toast específico
    return Promise.reject(error);
  }
);

export default api;