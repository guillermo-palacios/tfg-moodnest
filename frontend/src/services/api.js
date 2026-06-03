import axios from 'axios';

// Creamos una instancia de Axios apuntando a tu backend de Spring Boot
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// INTERCEPTOR: Se ejecuta automáticamente ANTES de enviar cada petición
api.interceptors.request.use(
  (config) => {
    // Buscamos el token en la memoria local del navegador
    const token = localStorage.getItem('token');
    
    // Si existe, le pegamos la pegatina de Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;