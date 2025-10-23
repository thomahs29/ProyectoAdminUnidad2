import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Documentos.css';

const Documentos = () => {
  const [documentos, setDocumentos] = useState([
    { id: 1, nombre: 'Cédula de Identidad', archivo: null, requerido: true },
    { id: 2, nombre: 'Certificado de Residencia', archivo: null, requerido: true },
    { id: 3, nombre: 'Certificado Escuela de Conductores', archivo: null, requerido: false },
    { id: 4, nombre: 'Declaración Jurada', archivo: null, requerido: false }
  ]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleFileChange = (id, e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          [id]: 'Solo se permiten archivos PDF, JPG o PNG'
        }));
        return;
      }

      // Validar tamaño (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          [id]: 'El archivo no debe superar los 10MB'
        }));
        return;
      }

      // Actualizar documento
      setDocumentos(prev =>
        prev.map(doc =>
          doc.id === id ? { ...doc, archivo: file } : doc
        )
      );

      // Limpiar error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleRemoveFile = (id) => {
    setDocumentos(prev =>
      prev.map(doc =>
        doc.id === id ? { ...doc, archivo: null } : doc
      )
    );
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Verificar que todos los documentos requeridos estén cargados
    const missingRequired = documentos.filter(
      doc => doc.requerido && !doc.archivo
    );

    if (missingRequired.length > 0) {
      newErrors.general = `Debe cargar los documentos requeridos: ${missingRequired.map(d => d.nombre).join(', ')}`;
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
      // Crear FormData para enviar archivos
      const formData = new FormData();
      
      documentos.forEach(doc => {
        if (doc.archivo) {
          formData.append('documentos', doc.archivo);
          formData.append('nombres', doc.nombre);
        }
      });

      // TODO: Llamada real a API cuando esté implementado
      // await api.post('/documentos', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' }
      // });

      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Guardar info en localStorage
      localStorage.setItem('documentosCargados', JSON.stringify({
        documentos: documentos.filter(d => d.archivo).map(d => ({
          nombre: d.nombre,
          archivo: d.archivo.name,
          fecha: new Date().toISOString()
        }))
      }));

      navigate('/confirmacion');
    } catch (error) {
      setErrors({ general: error.response?.data?.error || 'Error al subir documentos' });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const allRequiredUploaded = documentos
    .filter(d => d.requerido)
    .every(d => d.archivo);

  return (
    <div className="documentos-page">
      <div className="page-header">
        <h2>📎 Subir Documentos</h2>
        <p>Cargue los documentos necesarios para su trámite</p>
      </div>

      {errors.general && (
        <div className="alert alert-error">
          {errors.general}
        </div>
      )}

      <div className="documentos-container">
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="documentos-list">
              {documentos.map(doc => (
                <div key={doc.id} className="documento-item">
                  <div className="documento-header">
                    <h3>
                      {doc.nombre}
                      {doc.requerido && <span className="required-badge">Requerido</span>}
                    </h3>
                    <p>Formatos: PDF, JPG, PNG (máx. 10MB)</p>
                  </div>

                  {!doc.archivo ? (
                    <div className="upload-zone">
                      <input
                        type="file"
                        id={`file-${doc.id}`}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(doc.id, e)}
                        disabled={loading}
                        className="file-input"
                      />
                      <label htmlFor={`file-${doc.id}`} className="upload-label">
                        <div className="upload-icon">📁</div>
                        <p>Click para seleccionar archivo</p>
                        <span>o arrastre aquí</span>
                      </label>
                    </div>
                  ) : (
                    <div className="file-uploaded">
                      <div className="file-info">
                        <span className="file-icon">
                          {doc.archivo.type === 'application/pdf' ? '📄' : '🖼️'}
                        </span>
                        <div className="file-details">
                          <p className="file-name">{doc.archivo.name}</p>
                          <p className="file-size">{formatFileSize(doc.archivo.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => handleRemoveFile(doc.id)}
                        disabled={loading}
                      >
                        ❌
                      </button>
                    </div>
                  )}

                  {errors[doc.id] && (
                    <span className="error-message">{errors[doc.id]}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="alert alert-warning">
              <strong>Nota:</strong> Asegúrese de que los documentos sean legibles y estén completos. Los documentos incompletos o ilegibles serán rechazados.
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Volver
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !allRequiredUploaded}
              >
                {loading ? (
                  <>
                    <span className="loading"></span>
                    Subiendo...
                  </>
                ) : (
                  'Finalizar Reserva'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="info-sidebar">
          <div className="card">
            <h3>ℹ️ Requisitos de Documentos</h3>
            <ul>
              <li>Los archivos deben ser legibles y de buena calidad</li>
              <li>No se aceptan documentos vencidos</li>
              <li>Los documentos deben estar a nombre del solicitante</li>
              <li>Tamaño máximo por archivo: 10MB</li>
            </ul>
          </div>

          <div className="card progress-card">
            <h3>📊 Progreso</h3>
            <div className="progress-stats">
              <div className="stat">
                <span className="stat-value">
                  {documentos.filter(d => d.archivo).length}
                </span>
                <span className="stat-label">Subidos</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {documentos.filter(d => d.requerido && !d.archivo).length}
                </span>
                <span className="stat-label">Pendientes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentos;
