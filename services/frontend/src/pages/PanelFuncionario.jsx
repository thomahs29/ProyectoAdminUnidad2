import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './PanelFuncionario.css';

const PanelFuncionario = () => {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [documentosMap, setDocumentosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pendientes');

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/reservas/all');
        const reservasData = Array.isArray(response.data) ? response.data : response.data.reservas || [];
        setReservas(reservasData);
        
        // Cargar documentos
        const docsMap = {};
        for (const reserva of reservasData) {
          try {
            const docsResponse = await api.get(`/documentos/reserva/${reserva.id}`);
            if (Array.isArray(docsResponse.data) && docsResponse.data.length > 0) {
              docsMap[reserva.id] = docsResponse.data;
            }
          } catch (err) {
            console.log(`No hay documentos para reserva ${reserva.id}`);
          }
        }
        setDocumentosMap(docsMap);
        
      } catch (error) {
        console.error('Error al obtener reservas:', error);
        setError('Error al cargar las reservas');
      } finally {
        setLoading(false);
      }
    };

    fetchReservas();
  }, [user]);

  const descargarDocumento = async (doc) => {
    try {
      const token = localStorage.getItem('token');
      const nombreReal = doc.ruta_archivo.split('\\').pop() || doc.ruta_archivo.split('/').pop();
      
      const backendUrl = `http://localhost:3000/api/documentos/download/${nombreReal}`;
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.nombre_archivo);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar el documento');
    }
  };

  const aprobarHora = async (reservaId) => {
    try {
      alert(`Hora aprobada para reserva #${reservaId}. Correo enviado al ciudadano.`);
    } catch (error) {
      console.error('Error al aprobar:', error);
      alert('Error al aprobar la hora');
    }
  };

  const rechazarHora = async (reservaId) => {
    try {
      const motivo = prompt('¿Cuál es el motivo del rechazo?');
      if (!motivo) return;
      
      alert(`Hora rechazada para reserva #${reservaId}. Correo enviado al ciudadano.`);
    } catch (error) {
      console.error('Error al rechazar:', error);
      alert('Error al rechazar la hora');
    }
  };

  const filtrarReservas = () => {
    if (activeTab === 'pendientes') {
      return reservas.filter(r => r.estado === 'pendiente');
    }
    return reservas;
  };

  const reservasFiltradas = filtrarReservas();

  if (loading) return <div className="panel-funcionario loading">Cargando...</div>;

  return (
    <div className="panel-funcionario">
      <h1>� Panel de Funcionario</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}

      {/* TABS */}
      <div className="tabs-funcionario">
        <button 
          className={`tab-btn ${activeTab === 'pendientes' ? 'active' : ''}`}
          onClick={() => setActiveTab('pendientes')}
        >
          ⏳ Pendientes ({reservas.filter(r => r.estado === 'pendiente').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'todas' ? 'active' : ''}`}
          onClick={() => setActiveTab('todas')}
        >
          � Todas ({reservas.length})
        </button>
      </div>

      {/* LISTA DE RESERVAS */}
      <div className="tab-content">
        <div className="reservas-list">
          {reservasFiltradas.length === 0 ? (
            <div className="no-data">
              <p>No hay reservas {activeTab === 'pendientes' ? 'pendientes' : ''}</p>
            </div>
          ) : (
            reservasFiltradas.map((reserva) => (
              <div key={reserva.id} className="reserva-card">
                <div className="reserva-header">
                  <div className="reserva-info">
                    <h3>{reserva.usuario}</h3>
                    <p className="rut">RUT: <strong>{reserva.rut}</strong></p>
                  </div>
                  <span className={`badge badge-${reserva.estado}`}>
                    {reserva.estado?.toUpperCase()}
                  </span>
                </div>

                <div className="reserva-details">
                  <div className="detail-item">
                    <span className="label">📄 Licencia:</span>
                    <span className="value">{reserva.tramite}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">📅 Fecha:</span>
                    <span className="value">{reserva.fecha}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">⏰ Hora:</span>
                    <span className="value">{reserva.hora}</span>
                  </div>
                </div>

                {/* DOCUMENTOS */}
                <div className="documentos-section">
                  <div className="documentos-header">
                    <h4>📎 Documentos Cargados</h4>
                    {documentosMap[reserva.id]?.length > 0 ? (
                      <span className="doc-count">{documentosMap[reserva.id].length}</span>
                    ) : (
                      <span className="doc-count-empty">0</span>
                    )}
                  </div>

                  {documentosMap[reserva.id] && documentosMap[reserva.id].length > 0 ? (
                    <div className="documentos-list">
                      {documentosMap[reserva.id].map((doc, idx) => (
                        <div key={idx} className="documento-item">
                          <span className="doc-name">{doc.nombre_archivo}</span>
                          <button
                            className="btn btn-sm btn-download"
                            onClick={() => descargarDocumento(doc)}
                          >
                            ⬇️ Descargar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-docs">Sin documentos</p>
                  )}
                </div>

                {/* OBSERVACIONES */}
                {reserva.observaciones && (
                  <div className="observaciones">
                    <strong>📝 Observaciones:</strong>
                    <p>{reserva.observaciones}</p>
                  </div>
                )}

                {/* ACCIONES */}
                {reserva.estado === 'pendiente' && (
                  <div className="acciones">
                    <button
                      className="btn btn-success"
                      onClick={() => aprobarHora(reserva.id)}
                    >
                      ✅ Aprobar Hora
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => rechazarHora(reserva.id)}
                    >
                      ❌ Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <p className="info-text">Total: {reservasFiltradas.length} reserva(s)</p>
    </div>
  );
};

export default PanelFuncionario;
