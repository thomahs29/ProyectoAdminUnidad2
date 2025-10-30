import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import Confirmacion from './pages/Confirmacion';
import Documentos from './pages/Documentos';
import Login from './pages/Login';
import PanelFuncionario from './pages/PanelFuncionario';
import Reserva from './pages/Reserva';

// Componente para proteger rutas
const PrivateRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="loading"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Verificar rol si se requiere
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Componente para redirigir según el rol del usuario
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="loading"></div>
      </div>
    );
  }

  // Redirigir según el rol del usuario
  if (user?.role === 'funcionario' || user?.role === 'admin') {
    return <Navigate to="/funcionario" replace />;
  }

  // Por defecto, ciudadano
  return <Navigate to="/reserva" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública de login */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <RoleBasedRedirect />
              </PrivateRoute>
            }
          />
          <Route
            path="/reserva"
            element={
              <PrivateRoute>
                <Layout>
                  <Reserva />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/documentos"
            element={
              <PrivateRoute>
                <Layout>
                  <Documentos />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/confirmacion"
            element={
              <PrivateRoute>
                <Layout>
                  <Confirmacion />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/funcionario"
            element={
              <PrivateRoute requiredRole="funcionario">
                <Layout>
                  <PanelFuncionario />
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
