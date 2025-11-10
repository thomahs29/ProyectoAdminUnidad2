import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './MisDatosMunicipales.css';

export default function MisDatosMunicipales() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Redirigir si no está autenticado
        if (!user) {
            navigate('/login');
            return;
        }

        cargarDatos();
    }, [user, navigate]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError('');

            // Buscar datos municipales usando el RUT del usuario
            const response = await api.get(`/municipales/consultar?rut=${user.rut}`);
            setDatos(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar tus datos municipales');
            console.error('Error:', err);
        } finally {
            setCargando(false);
        }
    };

    const getEstadoColor = (estado) => {
        return estado === 'al_dia' ? 'al-dia' : 'con-deuda';
    };

    const getEstadoTexto = (estado) => {
        return estado === 'al_dia' ? '✅ Al día' : '⚠️ Con deuda';
    };

    if (cargando) {
        return (
            <div className="mis-datos-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Cargando tus datos municipales...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mis-datos-page">
            <div className="page-header">
                <h1>📋 Mis Datos Municipales</h1>
                <p>Estado actual de tus documentos y trámites</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                    <button onClick={cargarDatos} className="btn btn-sm btn-primary">
                        Reintentar
                    </button>
                </div>
            )}

            {datos && (
                <div className="datos-container">
                    <div className="header-usuario">
                        <h2>{datos.nombre}</h2>
                        <p className="rut-info">RUT: {datos.rut}</p>
                    </div>

                    <div className="datos-grid">
                        {/* LICENCIA */}
                        <div className={`dato-card ${getEstadoColor(datos.licencia.estado)}`}>
                            <div className="dato-header">
                                <h3>🚗 Licencia de Conducir</h3>
                                <span className={`estado-badge ${getEstadoColor(datos.licencia.estado)}`}>
                                    {getEstadoTexto(datos.licencia.estado)}
                                </span>
                            </div>
                            <div className="dato-content">
                                <p><strong>Número:</strong> {datos.licencia.numero}</p>
                                <p><strong>Vencimiento:</strong> {new Date(datos.licencia.fecha_vencimiento).toLocaleDateString('es-CL')}</p>
                                {datos.licencia.dias_para_vencer !== null && (
                                    <p className={datos.licencia.dias_para_vencer < 30 ? 'urgente' : ''}>
                                        <strong>Días restantes:</strong> <span className="dias">{datos.licencia.dias_para_vencer}</span> días
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* PATENTE */}
                        <div className={`dato-card ${getEstadoColor(datos.patente.estado)}`}>
                            <div className="dato-header">
                                <h3>🚙 Patente/Permiso</h3>
                                <span className={`estado-badge ${getEstadoColor(datos.patente.estado)}`}>
                                    {getEstadoTexto(datos.patente.estado)}
                                </span>
                            </div>
                            <div className="dato-content">
                                <p><strong>Número:</strong> {datos.patente.numero}</p>
                            </div>
                        </div>

                        {/* PERMISO DE CIRCULACIÓN */}
                        <div className={`dato-card ${getEstadoColor(datos.permiso_circulacion.estado)}`}>
                            <div className="dato-header">
                                <h3>📄 Permiso de Circulación</h3>
                                <span className={`estado-badge ${getEstadoColor(datos.permiso_circulacion.estado)}`}>
                                    {getEstadoTexto(datos.permiso_circulacion.estado)}
                                </span>
                            </div>
                        </div>

                        {/* JUZGADO */}
                        <div className={`dato-card ${getEstadoColor(datos.juzgado.estado)}`}>
                            <div className="dato-header">
                                <h3>⚖️ Juzgado</h3>
                                <span className={`estado-badge ${getEstadoColor(datos.juzgado.estado)}`}>
                                    {getEstadoTexto(datos.juzgado.estado)}
                                </span>
                            </div>
                        </div>

                        {/* DERECHOS DE ASEO */}
                        <div className={`dato-card ${getEstadoColor(datos.aseo.estado)}`}>
                            <div className="dato-header">
                                <h3>🧹 Derechos de Aseo</h3>
                                <span className={`estado-badge ${getEstadoColor(datos.aseo.estado)}`}>
                                    {getEstadoTexto(datos.aseo.estado)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RESUMEN */}
                    <div className="info-footer">
                        <p>Para mayor información o realizar trámites, acércate a la Oficina Municipal de Linares. Nuestro horario de atención es de lunes a viernes de 8:00 a 17:00 horas.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
