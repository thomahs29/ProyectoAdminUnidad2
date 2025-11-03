import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
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
    return <Navigate to="/funcionario" />;
  }

  // Por defecto, ciudadano
  return <Navigate to="/reserva" />;
};

export default Dashboard;
