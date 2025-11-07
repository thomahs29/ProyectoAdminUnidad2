import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <h1>🏛️ Municipalidad de Linares</h1>
              <p>Sistema de Reservas de Licencias de Conducir</p>
            </div>
            {isAuthenticated && (
              <div className="user-menu">
                <span className="user-name">👤 {user?.nombre || user?.email}</span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {isAuthenticated && (
        <nav className="nav">
          <div className="container">
            <ul className="nav-links">
              {/* Menú para Ciudadanos */}
              {user?.role === 'ciudadano' && (
                <>
                  <li>
                    <Link to="/reserva">📅 Reservar Hora</Link>
                  </li>
                  <li>
                    <Link to="/confirmacion">Ultima Reserva</Link>
                  </li>
                  <li>
                    <Link to="/mis-datos-municipales">📋 Mis Datos Municipales</Link>
                  </li>
                </>
              )}
              
              {/* Menú para Funcionarios */}
              {user?.role === 'funcionario' && (
                <>
                  <li>
                    <Link to="/funcionario">Panel de Funcionario</Link>
                  </li>
                </>
              )}
              
              {/* Menú para Administradores */}
              {user?.role === 'admin' && (
                <>
                  <li>
                    <Link to="/admin">🏛️ Panel de Administrador</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </nav>
      )}

      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 Municipalidad de Linares. Todos los derechos reservados.</p>
          <p>Sistema de Reservas de Licencias de Conducir</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
