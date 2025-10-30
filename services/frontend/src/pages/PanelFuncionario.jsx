import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './PanelFuncionario.css';

const PanelFuncionario = () => {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [tramites, setTramites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterFecha, setFilterFecha] = useState('');
  const [filterTramite, setFilterTramite] = useState('');
  const [activeTab, setActiveTab] = useState('reservas');
  const [reportData, setReportData] = useState(null);

  // Cargar datos desde localStorage (simulando backend)
  useEffect(() => {
    try {
      setLoading(true);

      // Simular datos de reservas desde localStorage
      const ultimaReserva = localStorage.getItem('ultimaReserva');
      if (ultimaReserva) {
        const reserva = JSON.parse(ultimaReserva);
        setReservas([reserva]);
      }

      // Simular datos de trámites
      const storedTramites = localStorage.getItem('tramitesData');
      if (storedTramites) {
        setTramites(JSON.parse(storedTramites));
      } else {
        // Datos de ejemplo si no hay en localStorage
        setTramites([
          {
            id: 1,
            usuario: 'Juan Pérez',
            rut: '12345678-9',
            tramite: 'Primer Otorgamiento',
            fecha: new Date().toISOString().split('T')[0],
            hora: '10:00',
            estado: 'Confirmada',
            documentos: 2,
            documentosCompletos: true
          },
          {
            id: 2,
            usuario: 'María García',
            rut: '98765432-1',
            tramite: 'Renovación',
            fecha: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            hora: '14:30',
            estado: 'Completada',
            documentos: 4,
            documentosCompletos: true
          }
        ]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setLoading(false);
    }
  }, []);

  // Filtrar reservas
  const filteredReservas = reservas.filter(res => {
    if (filterFecha && res.fecha !== filterFecha) return false;
    if (filterTramite && res.tramite_nombre !== filterTramite) return false;
    return true;
  });

  // Filtrar trámites
  const filteredTramites = tramites.filter(trami => {
    if (filterFecha && trami.fecha !== filterFecha) return false;
    if (filterTramite && trami.tramite !== filterTramite) return false;
    return true;
  });

  // Generar reporte CSV
  const generarReporte = () => {
    const data = activeTab === 'reservas' ? filteredReservas : filteredTramites;
    
    if (data.length === 0) {
      alert('No hay datos para generar reporte');
      return;
    }

    const headers = activeTab === 'reservas'
      ? ['Tipo de Trámite', 'Fecha', 'Hora', 'Estado', 'Documentos']
      : ['Usuario', 'RUT', 'Trámite', 'Fecha', 'Hora', 'Estado', 'Documentos'];

    const rows = data.map(item => 
      activeTab === 'reservas'
        ? [
            item.tramite_nombre || 'N/A',
            item.fecha || '',
            item.hora || '',
            item.estado || 'Pendiente',
            item.documentos || 0
          ]
        : [
            item.usuario || '',
            item.rut || '',
            item.tramite || '',
            item.fecha || '',
            item.hora || '',
            item.estado || '',
            item.documentos || 0
          ]
    );

    // Crear CSV
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Descargar
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Descargar documento
  const descargarDocumento = (nombreArchivo) => {
    alert(`Descargando: ${nombreArchivo}`);
    // Simulación - en producción buscaría del backend
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="panel-funcionario">
      <div className="panel-header">
        <h1>👨‍💼 Panel de Funcionario</h1>
        <p>Bienvenido, {user?.nombre || 'Funcionario'}</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'reservas' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservas')}
        >
          📅 Reservas ({filteredReservas.length})
        </button>
        <button
          className={`tab ${activeTab === 'tramites' ? 'active' : ''}`}
          onClick={() => setActiveTab('tramites')}
        >
          📋 Trámites ({filteredTramites.length})
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="filterFecha">Filtrar por Fecha:</label>
          <input
            type="date"
            id="filterFecha"
            value={filterFecha}
            onChange={(e) => setFilterFecha(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="filterTramite">Filtrar por Tipo:</label>
          <input
            type="text"
            id="filterTramite"
            placeholder="Ej: Primer Otorgamiento"
            value={filterTramite}
            onChange={(e) => setFilterTramite(e.target.value)}
          />
        </div>
        <button onClick={() => { setFilterFecha(''); setFilterTramite(''); }} className="btn btn-secondary">
          Limpiar Filtros
        </button>
        <button onClick={generarReporte} className="btn btn-primary">
          📊 Generar Reporte CSV
        </button>
      </div>

      {/* Tab: Reservas */}
      {activeTab === 'reservas' && (
        <div className="tab-content">
          {filteredReservas.length === 0 ? (
            <div className="empty-state">
              <p>📭 No hay reservas que mostrar</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo de Trámite</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Documentos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservas.map((res, idx) => (
                    <tr key={idx}>
                      <td>{res.tramite_nombre || 'N/A'}</td>
                      <td>{res.fecha}</td>
                      <td>{res.hora}</td>
                      <td>
                        <span className="badge badge-success">{res.estado || 'Confirmada'}</span>
                      </td>
                      <td>{res.documentos || 0}</td>
                      <td>
                        <button className="btn-action btn-view">👁️ Ver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Trámites */}
      {activeTab === 'tramites' && (
        <div className="tab-content">
          {filteredTramites.length === 0 ? (
            <div className="empty-state">
              <p>📭 No hay trámites que mostrar</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>RUT</th>
                    <th>Tipo de Trámite</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Documentos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTramites.map((trami) => (
                    <tr key={trami.id}>
                      <td>{trami.usuario}</td>
                      <td><strong>{trami.rut}</strong></td>
                      <td>{trami.tramite}</td>
                      <td>{trami.fecha}</td>
                      <td>{trami.hora}</td>
                      <td>
                        <span className={`badge badge-${
                          trami.estado === 'Completada' ? 'success' : 'warning'
                        }`}>
                          {trami.estado}
                        </span>
                      </td>
                      <td>
                        <span className={trami.documentosCompletos ? 'text-success' : 'text-warning'}>
                          {trami.documentosCompletos ? '✓' : '⚠️'} {trami.documentos}
                        </span>
                      </td>
                      <td>
                        <button className="btn-action btn-view">👁️ Ver</button>
                        <button className="btn-action btn-download">⬇️ Descargar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Estadísticas */}
      <div className="stats-section">
        <div className="stat-card">
          <h3>📅 Reservas Hoy</h3>
          <p className="stat-number">{filteredReservas.length}</p>
        </div>
        <div className="stat-card">
          <h3>📋 Trámites Pendientes</h3>
          <p className="stat-number">
            {filteredTramites.filter(t => t.estado !== 'Completada').length}
          </p>
        </div>
        <div className="stat-card">
          <h3>✓ Documentos Completos</h3>
          <p className="stat-number">
            {filteredTramites.filter(t => t.documentosCompletos).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PanelFuncionario;
