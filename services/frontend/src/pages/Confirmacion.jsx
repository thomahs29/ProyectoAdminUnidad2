import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Confirmacion.css';

const Confirmacion = () => {
  const [reserva, setReserva] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar datos de localStorage
    const reservaData = localStorage.getItem('ultimaReserva');
    const docsData = localStorage.getItem('documentosCargados');

    if (reservaData) {
      setReserva(JSON.parse(reservaData));
    }

    if (docsData) {
      setDocumentos(JSON.parse(docsData).documentos);
    }
  }, []);

  const handleNuevaReserva = () => {
    navigate('/reserva');
  };

  const handleVolverInicio = () => {
    navigate('/');
  };

  const tiposTramiteLabel = {
    'primer_otorgamiento': 'Primer Otorgamiento',
    'renovacion': 'Renovación',
    'duplicado': 'Duplicado',
    'canje': 'Canje',
    'cambio_clase': 'Cambio de Clase'
  };

  if (!reserva) {
    return (
      <div className="confirmacion-page">
        <div className="empty-state card">
          <div className="empty-icon">📋</div>
          <h2>No hay reservas pendientes</h2>
          <p>Aún no has realizado ninguna reserva</p>
          <button onClick={handleNuevaReserva} className="btn btn-primary">
            Crear Nueva Reserva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmacion-page">
      <div className="success-header">
        <div className="success-icon">✅</div>
        <h2>¡Reserva Confirmada!</h2>
        <p>Su solicitud ha sido procesada exitosamente</p>
      </div>

      <div className="confirmacion-container">
        <div className="main-content">
          <div className="card">
            <div className="section-header">
              <h3>📅 Detalles de la Reserva</h3>
            </div>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Tipo de Trámite:</span>
                <span className="detail-value">
                  {tiposTramiteLabel[reserva.tipoTramite] || reserva.tipoTramite}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Fecha:</span>
                <span className="detail-value">{reserva.fecha}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Hora:</span>
                <span className="detail-value">{reserva.hora}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Estado:</span>
                <span className="badge badge-success">Confirmada</span>
              </div>
            </div>

            {reserva.observaciones && (
              <div className="observations">
                <h4>Observaciones:</h4>
                <p>{reserva.observaciones}</p>
              </div>
            )}
          </div>

          {documentos.length > 0 && (
            <div className="card">
              <div className="section-header">
                <h3>📎 Documentos Cargados</h3>
              </div>
              <div className="documentos-list-simple">
                {documentos.map((doc, index) => (
                  <div key={index} className="documento-simple">
                    <span className="doc-icon">
                      {doc.archivo.endsWith('.pdf') ? '📄' : '🖼️'}
                    </span>
                    <div className="doc-info">
                      <p className="doc-name">{doc.nombre}</p>
                      <p className="doc-file">{doc.archivo}</p>
                    </div>
                    <span className="doc-status">✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="alert alert-info">
            <strong>📧 Confirmación enviada</strong>
            <p>Hemos enviado un correo electrónico con los detalles de su reserva. Por favor, revise su bandeja de entrada y spam.</p>
          </div>

          <div className="actions-section">
            <button onClick={handleVolverInicio} className="btn btn-secondary">
              Volver al Inicio
            </button>
            <button onClick={handleNuevaReserva} className="btn btn-outline">
              Nueva Reserva
            </button>
          </div>
        </div>

        <div className="sidebar">
          <div className="card info-card">
            <h3>📌 Próximos Pasos</h3>
            <ol className="steps-list">
              <li>
                <strong>Revise su correo</strong>
                <p>Recibirá un correo de confirmación con todos los detalles</p>
              </li>
              <li>
                <strong>Prepare sus documentos</strong>
                <p>Verifique que tiene todos los documentos físicos</p>
              </li>
              <li>
                <strong>Llegue con anticipación</strong>
                <p>Presente se 10 minutos antes de su hora</p>
              </li>
              <li>
                <strong>Traiga su cédula</strong>
                <p>Documento de identidad es obligatorio</p>
              </li>
            </ol>
          </div>

          <div className="card warning-card">
            <h3>⚠️ Importante</h3>
            <ul>
              <li>Guarde el número de confirmación de su correo</li>
              <li>Si no puede asistir, cancele con anticipación</li>
              <li>Máximo 2 reprogramaciones permitidas</li>
              <li>Llegue puntual a su cita</li>
            </ul>
          </div>

          <div className="card contact-card">
            <h3>📞 ¿Necesita Ayuda?</h3>
            <div className="contact-info">
              <p><strong>Teléfono:</strong></p>
              <p>📱 +56 9 1234 5678</p>
              <p><strong>Email:</strong></p>
              <p>📧 licencias@linares.cl</p>
              <p><strong>Horario:</strong></p>
              <p>🕐 Lun-Vie: 08:00 - 17:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmacion;
