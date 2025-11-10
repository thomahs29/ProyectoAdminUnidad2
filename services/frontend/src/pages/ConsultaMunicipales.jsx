import { useState } from 'react';
import api from '../services/api';
import './ConsultaMunicipales.css';

export default function ConsultaMunicipales() {
    const [rut, setRut] = useState('');
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const formatearRUT = (valor) => {
        // Formato: XX.XXX.XXX-X
        valor = valor.replace(/[^0-9K]/gi, '');
        if (valor.length >= 8) {
            valor = valor.slice(0, 8) + '-' + valor.slice(8, 9);
        }
        if (valor.length >= 6) {
            valor = valor.slice(0, 2) + '.' + valor.slice(2);
        }
        return valor;
    };

    const handleRutChange = (e) => {
        const valor = formatearRUT(e.target.value);
        setRut(valor);
    };

    const handleConsultar = async (e) => {
        e.preventDefault();
        setError('');
        setDatos(null);

        if (!rut || rut.length < 12) {
            setError('RUT inválido. Formato: XX.XXX.XXX-X');
            return;
        }

        setCargando(true);
        try {
            const response = await api.get(`/municipales/consultar?rut=${rut}`);
            setDatos(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al consultar datos municipales');
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

    return (
        <div className="consulta-municipales-page">
            <div className="page-header">
                <h1>🏛️ Consulta de Datos Municipales</h1>
                <p>Ingresa tu RUT para conocer tu estado municipal</p>
            </div>

            <div className="consulta-container">
                <div className="consulta-form-card">
                    <form onSubmit={handleConsultar} className="consulta-form">
                        <div className="input-group">
                            <label htmlFor="rut">RUT *</label>
                            <input
                                type="text"
                                id="rut"
                                value={rut}
                                onChange={handleRutChange}
                                placeholder="12.345.678-9"
                                disabled={cargando}
                                maxLength="12"
                            />
                            <small>Formato: XX.XXX.XXX-X</small>
                        </div>

                        {error && (
                            <div className="alert alert-error">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={cargando || rut.length < 12}
                            className="btn btn-primary"
                        >
                            {cargando ? (
                                <>
                                    <span className="loading"></span>
                                    Consultando...
                                </>
                            ) : (
                                '🔍 Consultar'
                            )}
                        </button>
                    </form>
                </div>

                {datos && (
                    <div className="resultados-container">
                        <div className="header-resultado">
                            <h2>📋 Datos de {datos.nombre}</h2>
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
                                    <p><strong>Vencimiento:</strong> {datos.licencia.fecha_vencimiento}</p>
                                    {datos.licencia.dias_para_vencer !== null && (
                                        <p className={datos.licencia.dias_para_vencer < 30 ? 'urgente' : ''}>
                                            <strong>Días restantes:</strong> {datos.licencia.dias_para_vencer} días
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

                        <div className="resumen-estado">
                            <h3>📊 Resumen General</h3>
                            {(() => {
                                const conDeuda = [
                                    datos.licencia.estado,
                                    datos.patente.estado,
                                    datos.permiso_circulacion.estado,
                                    datos.juzgado.estado,
                                    datos.aseo.estado,
                                ].filter(e => e === 'con_deuda').length;

                                return (
                                    <p>
                                        <strong>{5 - conDeuda}</strong> servicios al día | 
                                        <strong> {conDeuda}</strong> con deuda
                                    </p>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
