import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import Confirmacion from './pages/Confirmacion';
import Documentos from './pages/Documentos';
import Login from './pages/Login';
import Reserva from './pages/Reserva';

// Componente para proteger rutas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

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

  return isAuthenticated ? children : <Navigate to="/login" />;
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
                <Layout>
                  <Navigate to="/reserva" />
                </Layout>
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

          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
