import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario del localStorage al iniciar
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (rut, password) => {
    try {
      const response = await api.post('/users/login', { rut, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response?.status === 400) {
        errorMessage = 'RUT o contraseña incorrectos';
      } else if (error.response?.status === 401) {
        errorMessage = 'RUT o contraseña incorrectos';
      } else if (error.response?.status === 500) {
        errorMessage = 'Error del servidor. Por favor intenta más tarde';
      } else if (error.message === 'Network Error') {
        errorMessage = 'Error de conexión. Verifica que el servidor esté activo';
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
