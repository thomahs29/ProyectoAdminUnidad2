import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './PanelAdministrador.css';

const PanelAdministrador = () => {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros de búsqueda
  const [searchRut, setSearchRut] = useState('');
  const [searchNombre, setSearchNombre] = useState('');
  const [searchTramite, setSearchTramite] = useState('');
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  
  // Estados
  const [activeTab, setActiveTab] = useState('reservas');
  const [estadisticas, setEstadisticas] = useState(null);
  const [licenciasMasSolicitadas, setLicenciasMasSolicitadas] = useState([]);

  // Cargar reservas y datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/reservas/all');
        const reservasData = Array.isArray(response.data) ? response.data : response.data.reservas || [];
        setReservas(reservasData);
        
        // Calcular estadísticas
        calcularEstadisticas(reservasData);
        calcularLicenciasMasSolicitadas(reservasData);
        
      } catch (error) {
        console.error('Error al obtener datos:', error);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const calcularEstadisticas = (data) => {
    const stats = {
      totalReservas: data.length,
      pendientes: data.filter(r => r.estado === 'pendiente').length,
      anuladas: data.filter(r => r.estado === 'anulada').length,
      completadas: data.filter(r => r.estado === 'completada').length,
    };
    setEstadisticas(stats);
  };

  const calcularLicenciasMasSolicitadas = (data) => {
    const conteo = {};
    data.forEach(reserva => {
      const tramite = reserva.tramite;
      conteo[tramite] = (conteo[tramite] || 0) + 1;
    });
    
    const sorted = Object.entries(conteo)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
    
    setLicenciasMasSolicitadas(sorted);
  };

  // Filtrar reservas
  const reservasFiltradas = reservas.filter(res => {
    if (searchRut && !res.rut?.toLowerCase().includes(searchRut.toLowerCase())) return false;
    if (searchNombre && !res.usuario?.toLowerCase().includes(searchNombre.toLowerCase())) return false;
    if (searchTramite && !res.tramite?.toLowerCase().includes(searchTramite.toLowerCase())) return false;
    
    if (filterFechaInicio && new Date(res.fecha) < new Date(filterFechaInicio)) return false;
    if (filterFechaFin && new Date(res.fecha) > new Date(filterFechaFin)) return false;
    
    return true;
  });

  // Exportar a CSV
  const exportarCSV = () => {
    const headers = ['RUT', 'Nombre', 'Tipo de Licencia', 'Fecha', 'Hora', 'Estado', 'Observaciones'];
    const rows = reservasFiltradas.map(item => [
      item.rut || '',
      item.usuario || '',
      item.tramite || '',
      item.fecha || '',
      item.hora || '',
      item.estado || '',
      item.observaciones || ''
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_reservas_${new Date().getTime()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Enviar notificación
  const enviarNotificacion = async (reservaId) => {
    try {
      const mensaje = prompt('¿Cuál es el mensaje de notificación?');
      if (!mensaje) return;
      
      // Aquí iría la lógica para enviar notificación
      alert(`Notificación enviada: ${mensaje}`);
    } catch (error) {
      console.error('Error al enviar notificación:', error);
    }
  };

  if (loading) return null;

  return (
    <div className="panel-admin">
      <h1>🏛️ Panel de Administrador</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs */}
      <div className="tabs-admin">
        <button 
          className={`tab-btn ${activeTab === 'reservas' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservas')}
        >
          📋 Reservas
        </button>
        <button 
          className={`tab-btn ${activeTab === 'estadisticas' ? 'active' : ''}`}
          onClick={() => setActiveTab('estadisticas')}
        >
          📊 Estadísticas
        </button>
        <button 
          className={`tab-btn ${activeTab === 'notificaciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('notificaciones')}
        >
          📧 Notificaciones
        </button>
      </div>

      {/* TAB: RESERVAS */}
      {activeTab === 'reservas' && (
        <div className="tab-content">
          <h2>Búsqueda y Filtros Avanzados</h2>
          
          <div className="filtros-grid">
            <div className="filtro-group">
              <label>🔍 Buscar por RUT:</label>
              <input
                type="text"
                placeholder="Ej: 12345678-9"
                value={searchRut}
                onChange={(e) => setSearchRut(e.target.value)}
              />
            </div>
            
            <div className="filtro-group">
              <label>👤 Buscar por Nombre:</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={searchNombre}
                onChange={(e) => setSearchNombre(e.target.value)}
              />
            </div>
            
            <div className="filtro-group">
              <label>📄 Tipo de Licencia:</label>
              <input
                type="text"
                placeholder="Ej: Clase B"
                value={searchTramite}
                onChange={(e) => setSearchTramite(e.target.value)}
              />
            </div>
            
            <div className="filtro-group">
              <label>📅 Fecha Inicio:</label>
              <input
                type="date"
                value={filterFechaInicio}
                onChange={(e) => setFilterFechaInicio(e.target.value)}
              />
            </div>
            
            <div className="filtro-group">
              <label>📅 Fecha Fin:</label>
              <input
                type="date"
                value={filterFechaFin}
                onChange={(e) => setFilterFechaFin(e.target.value)}
              />
            </div>
          </div>

          <div className="actions-admin">
            <button 
              onClick={() => {
                setSearchRut('');
                setSearchNombre('');
                setSearchTramite('');
                setFilterFechaInicio('');
                setFilterFechaFin('');
              }}
              className="btn btn-secondary"
            >
              Limpiar Filtros
            </button>
            <button onClick={exportarCSV} className="btn btn-primary">
              📥 Exportar a CSV
            </button>
          </div>

          <div className="tabla-container">
            <table className="tabla-reservas">
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Nombre</th>
                  <th>Tipo de Licencia</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservasFiltradas.map((reserva) => (
                  <tr key={reserva.id}>
                    <td><strong>{reserva.rut}</strong></td>
                    <td>{reserva.usuario}</td>
                    <td>{reserva.tramite}</td>
                    <td>{reserva.fecha}</td>
                    <td>{reserva.hora}</td>
                    <td>
                      <span className={`badge badge-${reserva.estado}`}>
                        {reserva.estado}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-info"
                        onClick={() => enviarNotificacion(reserva.id)}
                      >
                        📧 Notificar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="info-text">Total de registros: {reservasFiltradas.length}</p>
        </div>
      )}

      {/* TAB: ESTADÍSTICAS */}
      {activeTab === 'estadisticas' && (
        <div className="tab-content">
          <h2>Estadísticas del Sistema</h2>
          
          {estadisticas && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{estadisticas.totalReservas}</div>
                <div className="stat-label">Total de Reservas</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{estadisticas.pendientes}</div>
                <div className="stat-label">Pendientes</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{estadisticas.completadas}</div>
                <div className="stat-label">Completadas</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{estadisticas.anuladas}</div>
                <div className="stat-label">Anuladas</div>
              </div>
            </div>
          )}

          <h3>📊 Licencias Más Solicitadas</h3>
          <div className="licencias-chart">
            {licenciasMasSolicitadas.map((lic, idx) => (
              <div key={idx} className="licencia-bar">
                <div className="licencia-nombre">{lic.nombre}</div>
                <div className="licencia-progress">
                  <div 
                    className="progress-bar"
                    style={{width: `${(lic.cantidad / (licenciasMasSolicitadas[0]?.cantidad || 1)) * 100}%`}}
                  >
                    <span className="progress-value">{lic.cantidad}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: NOTIFICACIONES */}
      {activeTab === 'notificaciones' && (
        <div className="tab-content">
          <h2>Enviar Notificaciones a Contribuyentes</h2>
          
          <div className="notificacion-form">
            <div className="form-group">
              <label>Seleccionar Tipo de Notificación:</label>
              <select>
                <option value="">-- Selecciona --</option>
                <option value="documentos_faltantes">Documentos Faltantes</option>
                <option value="hora_confirmada">Hora Confirmada</option>
                <option value="recordatorio">Recordatorio de Cita</option>
                <option value="general">Notificación General</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Mensaje:</label>
              <textarea 
                placeholder="Escribe el mensaje de la notificación..."
                rows="5"
              />
            </div>
            
            <div className="form-group">
              <label>Enviar a:</label>
              <div className="radio-options">
                <label>
                  <input type="radio" name="enviar_a" value="todos" defaultChecked />
                  Todos los Contribuyentes
                </label>
                <label>
                  <input type="radio" name="enviar_a" value="pendientes" />
                  Solo Reservas Pendientes
                </label>
                <label>
                  <input type="radio" name="enviar_a" value="especifico" />
                  Contribuyente Específico
                </label>
              </div>
            </div>
            
            <button className="btn btn-primary btn-lg">
              📧 Enviar Notificación
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelAdministrador;
