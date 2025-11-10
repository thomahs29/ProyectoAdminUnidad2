import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Cliente para el backend
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Cliente para el AI Service (ahora a través del API Gateway)
// En desarrollo: usa localhost:3001 directamente
// En producción: usa /api/ai (ruta en nginx)
const aiApi = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:3001/api/ai' : '/api/ai',
  headers: {
    'Content-Type': 'application/json'
  }
});

console.log('🔧 [API Config] Ambiente:', import.meta.env.DEV ? 'desarrollo' : 'producción');
console.log('🔧 [API Config] aiApi baseURL:', aiApi.defaults.baseURL);

// Interceptor para agregar token JWT al backend
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

// Interceptor para agregar token JWT al AI Service
aiApi.interceptors.request.use(
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

// Interceptor para manejar errores de autenticación en backend
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación en AI Service
aiApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
export { aiApi };

