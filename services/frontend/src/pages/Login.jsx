import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Validación de formato RUT chileno
  const validateRut = (rut) => {
    const rutRegex = /^[0-9]{7,8}-[0-9Kk]$/;
    return rutRegex.test(rut);
  };

  // Formatear RUT mientras se escribe
  const formatRut = (value) => {
    // Eliminar caracteres no permitidos
    const cleaned = value.replace(/[^0-9Kk]/g, '');
    
    // Si tiene más de 1 carácter, agregar guión
    if (cleaned.length > 1) {
      const body = cleaned.slice(0, -1);
      const dv = cleaned.slice(-1);
      return `${body}-${dv}`;
    }
    
    return cleaned;
  };

  const handleRutChange = (e) => {
    const formatted = formatRut(e.target.value);
    setRut(formatted);
    
    // Limpiar error si existe
    if (errors.rut) {
      setErrors({ ...errors, rut: '' });
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors({ ...errors, password: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!rut.trim()) {
      newErrors.rut = 'El RUT es obligatorio';
    } else if (!validateRut(rut)) {
      newErrors.rut = 'Formato de RUT inválido (ejemplo: 12345678-9)';
    }

    if (!password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await login(rut, password);
      
      if (result.success) {
        // Obtener el usuario del contexto después del login
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Redirigir según el rol
          if (userData.role === 'funcionario' || userData.role === 'admin') {
            navigate('/funcionario');
          } else {
            navigate('/reserva');
          }
        } else {
          navigate('/reserva');
        }
      } else {
        setGeneralError(result.error);
      }
    } catch (error) {
      setGeneralError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClaveUnica = () => {
    // TODO: Implementar integración con Clave Única
    alert('Integración con Clave Única en desarrollo');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card card">
          <div className="login-header">
            <h2>🏛️ Bienvenido</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          {generalError && (
            <div className="alert alert-error">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="rut">RUT</label>
              <input
                type="text"
                id="rut"
                value={rut}
                onChange={handleRutChange}
                placeholder="12345678-9"
                maxLength="10"
                className={errors.rut ? 'input-error' : ''}
                disabled={loading}
              />
              {errors.rut && <span className="error-message">{errors.rut}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Ingresa tu contraseña"
                className={errors.password ? 'input-error' : ''}
                disabled={loading}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading"></span>
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>o</span>
          </div>

          <button 
            type="button" 
            className="btn btn-outline btn-block"
            onClick={handleClaveUnica}
            disabled={loading}
          >
            🔐 Ingresar con Clave Única
          </button>

          <div className="login-footer">
            <p>¿Primera vez aquí? El sistema usará tu RUT para buscar tus datos automáticamente.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
