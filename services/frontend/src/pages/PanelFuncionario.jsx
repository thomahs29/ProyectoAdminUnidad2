import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './PanelFuncionario.css';

const PanelFuncionario = () => {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterFecha, setFilterFecha] = useState('');
  const [filterTramite, setFilterTramite] = useState('');
  const [activeTab, setActiveTab] = useState('reservas');
  const [error, setError] = useState(null);

  const [documentosMap, setDocumentosMap] = useState({});

  // Cargar reservas del backend
  useEffect(() => {
    console.log('Usuario actual:', user);
    console.log('Rol del usuario:', user?.role);
    
    const fetchReservas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener todas las reservas del backend
        const response = await api.get('/reservas/all');
        console.log('Reservas del backend:', response.data);
        
        // Mapear datos del backend
        const reservasData = Array.isArray(response.data) ? response.data : response.data.reservas || [];
        setReservas(reservasData);
        
        // Obtener documentos de cada reserva
        const docsMap = {};
        for (const reserva of reservasData) {
          try {
            const docsResponse = await api.get(`/documentos/reserva/${reserva.id}`);
            console.log(`Documentos para reserva ${reserva.id}:`, docsResponse.data);
            if (Array.isArray(docsResponse.data) && docsResponse.data.length > 0) {
              docsMap[reserva.id] = docsResponse.data;
            }
          } catch (docsError) {
            console.log(`No hay documentos para reserva ${reserva.id}`);
          }
        }
        setDocumentosMap(docsMap);
        
      } catch (error) {
        console.error('Error al obtener reservas:', error);
        console.error('Error completo:', error.response);
        setError('Error al cargar las reservas del servidor');
        // Si falla, intentar desde localStorage como fallback
        const ultimaReserva = localStorage.getItem('ultimaReserva');
        if (ultimaReserva) {
          setReservas([JSON.parse(ultimaReserva)]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReservas();
  }, [user]);

  // Filtrar reservas
  const filteredReservas = reservas.filter(res => {
    if (filterFecha && new Date(res.fecha).toISOString().split('T')[0] !== filterFecha) return false;
    if (filterTramite && res.tramite && !res.tramite.toLowerCase().includes(filterTramite.toLowerCase())) return false;
    return true;
  });

  // Generar reporte CSV
  const generarReporte = () => {
    if (filteredReservas.length === 0) {
      alert('No hay datos para generar reporte');
      return;
    }

    const headers = ['RUT Usuario', 'Tipo de Trámite', 'Fecha', 'Hora', 'Estado', 'Observaciones'];

    const rows = filteredReservas.map(item => [
      item.rut || 'N/A',
      item.tramite || 'N/A',
      new Date(item.fecha).toLocaleDateString('es-CL'),
      item.hora || 'N/A',
      item.estado || 'Pendiente',
      item.observaciones || ''
    ]);

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
    a.download = `reporte_reservas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Descargar documentos de una reserva
  const descargarDocumento = async (reservaId) => {
    try {
      const docs = documentosMap[reservaId];
      
      if (!docs || docs.length === 0) {
        alert('No hay documentos para esta reserva');
        return;
      }

      // Obtener el token del localStorage
      const token = localStorage.getItem('token');

      // Descargar cada documento
      for (const doc of docs) {
        console.log('Descargando documento:', doc);
        console.log('Nombre archivo:', doc.nombre_archivo);
        console.log('Ruta archivo:', doc.ruta_archivo);
        try {
          // Extraer el nombre real del archivo de la ruta
          const nombreReal = doc.ruta_archivo.split('\\').pop() || doc.ruta_archivo.split('/').pop();
          console.log('Nombre real a descargar:', nombreReal);
          
          // Usar URL absoluta del backend para descargar
          const backendUrl = `http://localhost:3000/api/documentos/download/${nombreReal}`;
          const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // Crear blob y descargar
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          // Usar el nombre descriptivo para la descarga
          link.setAttribute('download', doc.nombre_archivo);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          console.log('Documento descargado:', doc.nombre_archivo);
        } catch (error) {
          console.error(`Error descargando ${doc.nombre_archivo}:`, error);
        }
      }

    } catch (error) {
      console.error('Error al descargar documentos:', error);
      alert('Error al descargar los documentos');
    }
  };  if (loading) {
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

      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'reservas' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservas')}
        >
          📅 Reservas ({filteredReservas.length})
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
                    <th>RUT Usuario</th>
                    <th>Tipo de Trámite</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservas.map((res) => {
                    // Formatear fecha correctamente
                    let fechaFormato = 'N/A';
                    if (res.fecha) {
                      if (typeof res.fecha === 'string' && !res.fecha.includes('T')) {
                        // Ya está formateada como dd-mm-yyyy o similar
                        fechaFormato = res.fecha;
                      } else {
                        // Es ISO string o Date
                        try {
                          fechaFormato = new Date(res.fecha).toLocaleDateString('es-CL');
                        } catch {
                          fechaFormato = res.fecha;
                        }
                      }
                    }
                    
                    return (
                    <tr key={res.id}>
                      <td><strong>{res.rut || 'N/A'}</strong></td>
                      <td>{res.tramite || 'N/A'}</td>
                      <td>{fechaFormato}</td>
                      <td>{res.hora || 'N/A'}</td>
                      <td>
                        <span className="badge badge-success">{res.estado || 'Pendiente'}</span>
                      </td>
                      <td>
                        <button 
                          className="btn-action btn-download"
                          onClick={() => descargarDocumento(res.id)}
                          title="Descargar documentos"
                        >
                          ⬇️ Descargar
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Estadísticas */}
      <div className="stats-section">
        <div className="stat-card">
          <h3>📅 Total de Reservas</h3>
          <p className="stat-number">{filteredReservas.length}</p>
        </div>
        <div className="stat-card">
          <h3>⏳ Reservas Pendientes</h3>
          <p className="stat-number">
            {filteredReservas.filter(r => r.estado === 'Pendiente' || r.estado === 'Confirmada').length}
          </p>
        </div>
        <div className="stat-card">
          <h3>✓ Reservas Completadas</h3>
          <p className="stat-number">
            {filteredReservas.filter(r => r.estado === 'Completada').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PanelFuncionario;
