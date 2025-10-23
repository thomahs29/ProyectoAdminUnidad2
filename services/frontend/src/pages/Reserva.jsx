import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Reserva.css';

const Reserva = () => {
  const [formData, setFormData] = useState({
    tipoTramite: '',
    fecha: '',
    hora: '',
    observaciones: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const navigate = useNavigate();

  const tiposTramite = [
    { value: 'primer_otorgamiento', label: 'Primer Otorgamiento' },
    { value: 'renovacion', label: 'Renovación' },
    { value: 'duplicado', label: 'Duplicado' },
    { value: 'canje', label: 'Canje' },
    { value: 'cambio_clase', label: 'Cambio de Clase' }
  ];

  // Generar horas disponibles (08:00 - 17:00)
  useEffect(() => {
    const horas = [];
    for (let i = 8; i <= 16; i++) {
      horas.push(`${i.toString().padStart(2, '0')}:00`);
      horas.push(`${i.toString().padStart(2, '0')}:30`);
    }
    setHorasDisponibles(horas);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!formData.tipoTramite) {
      newErrors.tipoTramite = 'Debe seleccionar un tipo de trámite';
    }

    if (!formData.fecha) {
      newErrors.fecha = 'Debe seleccionar una fecha';
    } else if (formData.fecha < today) {
      newErrors.fecha = 'La fecha no puede ser anterior a hoy';
    }

    if (!formData.hora) {
      newErrors.hora = 'Debe seleccionar una hora';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Llamada real a API cuando esté implementado el backend
      await api.post('/reservas', formData);
      
      // Guardar datos en localStorage temporalmente
      localStorage.setItem('ultimaReserva', JSON.stringify({
        ...formData,
        fecha: new Date(formData.fecha).toLocaleDateString('es-CL'),
        timestamp: new Date().toISOString()
      }));

      navigate('/documentos');
    } catch (error) {
      setErrors({ general: error.response?.data?.error || 'Error al crear la reserva' });
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div className="reserva-page">
      <div className="page-header">
        <h2>📅 Reservar Hora de Atención</h2>
        <p>Complete el formulario para reservar su hora en el Departamento de Tránsito</p>
      </div>

      {errors.general && (
        <div className="alert alert-error">
          {errors.general}
        </div>
      )}

      <div className="reserva-container">
        <div className="card">
          <form onSubmit={handleSubmit} className="reserva-form">
            <div className="input-group">
              <label htmlFor="tipoTramite">Tipo de Trámite / Licencia *</label>
              <select
                id="tipoTramite"
                name="tipoTramite"
                value={formData.tipoTramite}
                onChange={handleChange}
                className={errors.tipoTramite ? 'input-error' : ''}
                disabled={loading}
              >
                <option value="">Seleccione un tipo de trámite</option>
                {tiposTramite.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              {errors.tipoTramite && <span className="error-message">{errors.tipoTramite}</span>}
            </div>

            <div className="form-row">
              <div className="input-group">
                <label htmlFor="fecha">Fecha *</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  min={minDate}
                  max={maxDate}
                  className={errors.fecha ? 'input-error' : ''}
                  disabled={loading}
                />
                {errors.fecha && <span className="error-message">{errors.fecha}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="hora">Hora *</label>
                <select
                  id="hora"
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  className={errors.hora ? 'input-error' : ''}
                  disabled={loading}
                >
                  <option value="">Seleccione una hora</option>
                  {horasDisponibles.map(hora => (
                    <option key={hora} value={hora}>
                      {hora}
                    </option>
                  ))}
                </select>
                {errors.hora && <span className="error-message">{errors.hora}</span>}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="observaciones">Observaciones (opcional)</label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="4"
                placeholder="Ingrese cualquier información adicional..."
                disabled={loading}
              />
            </div>

            <div className="alert alert-info">
              <strong>Importante:</strong> Después de reservar, deberá subir los documentos requeridos para su trámite.
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading"></span>
                    Reservando...
                  </>
                ) : (
                  'Continuar a Documentos'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="info-sidebar">
          <div className="card">
            <h3>📋 Información Importante</h3>
            <ul>
              <li>Las reservas deben realizarse con al menos 24 horas de anticipación</li>
              <li>Puede reservar hasta 30 días en el futuro</li>
              <li>Recuerde llegar 10 minutos antes de su hora</li>
              <li>Si no puede asistir, cancele su reserva con anticipación</li>
            </ul>
          </div>

          <div className="card">
            <h3>📄 Documentos Necesarios</h3>
            <p>Dependiendo del tipo de trámite, necesitará:</p>
            <ul>
              <li>Cédula de Identidad</li>
              <li>Certificado de Residencia</li>
              <li>Certificado de Escuela de Conductores</li>
              <li>Declaraciones Juradas (si aplica)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reserva;
