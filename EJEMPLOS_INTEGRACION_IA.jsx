import { useState } from 'react';
import { detectarVencimientos, enviarPregunta, obtenerFAQs } from '../services/aiService';

/**
 * EJEMPLO 1: Página de Chat con IA
 */
export function PaginaChat() {
    const [pregunta, setPregunta] = useState('');
    const [respuesta, setRespuesta] = useState(null);
    const [cargando, setCargando] = useState(false);

    const handleEnviarPregunta = async () => {
        setCargando(true);
        try {
            const result = await enviarPregunta(pregunta);
            setRespuesta(result);
            setPregunta('');
        } catch (error) {
            alert('Error: ' + error.message);
        }
        setCargando(false);
    };

    return (
        <div>
            <h2>Preguntas sobre Licencias</h2>
            <textarea
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                placeholder="¿Cuál es tu pregunta?"
            />
            <button onClick={handleEnviarPregunta} disabled={cargando}>
                {cargando ? 'Procesando...' : 'Enviar'}
            </button>

            {respuesta && (
                <div>
                    <h3>Respuesta:</h3>
                    <p>{respuesta.respuesta}</p>
                </div>
            )}
        </div>
    );
}

/**
 * EJEMPLO 2: Widget de Vencimientos
 */
export function WidgetVencimientos() {
    const [vencimientos, setVencimientos] = useState([]);
    const [cargando, setCargando] = useState(false);

    const cargarVencimientos = async () => {
        setCargando(true);
        try {
            const result = await detectarVencimientos(30);
            setVencimientos(result);
        } catch (error) {
            console.error(error);
        }
        setCargando(false);
    };

    return (
        <div className="widget-vencimientos">
            <h3>⚠️ Licencias por Vencer</h3>
            <button onClick={cargarVencimientos} disabled={cargando}>
                {cargando ? 'Cargando...' : 'Revisar Vencimientos'}
            </button>

            {vencimientos.length > 0 && (
                <ul>
                    {vencimientos.map((v) => (
                        <li key={v.usuarioId}>
                            <strong>{v.nombre}</strong> - Vence en {v.diasRestantes} días
                            <p>{v.recordatorio}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/**
 * EJEMPLO 3: Sección de FAQs
 */
export function SeccionFAQs() {
    const [faqs, setFaqs] = useState([]);
    const [expandido, setExpandido] = useState(null);

    const cargarFAQs = async () => {
        try {
            const result = await obtenerFAQs();
            setFaqs(result);
        } catch (error) {
            console.error(error);
        }
    };

    if (faqs.length === 0) {
        return (
            <div>
                <button onClick={cargarFAQs}>Cargar FAQs</button>
            </div>
        );
    }

    return (
        <div className="faqs-seccion">
            <h2>📚 Preguntas Frecuentes</h2>
            {faqs.map((faq) => (
                <div key={faq.id} className="faq-item">
                    <button
                        onClick={() =>
                            setExpandido(expandido === faq.id ? null : faq.id)
                        }
                    >
                        {expandido === faq.id ? '▼' : '▶'} {faq.pregunta}
                    </button>
                    {expandido === faq.id && (
                        <p className="faq-respuesta">{faq.respuesta}</p>
                    )}
                </div>
            ))}
        </div>
    );
}

/**
 * EJEMPLO 4: Integración en el Dashboard
 */
export function Dashboard() {
    return (
        <div className="dashboard">
            <header>
                <h1>🏛️ Sistema Municipal - Panel de Control</h1>
            </header>

            <section className="seccion-ia">
                <h2>Asistencia Inteligente</h2>
                <PaginaChat />
            </section>

            <section className="seccion-vencimientos">
                <WidgetVencimientos />
            </section>

            <section className="seccion-faqs">
                <SeccionFAQs />
            </section>
        </div>
    );
}

/**
 * EJEMPLO 5: Hook personalizado para IA
 */
export function useIA() {
    const [respuesta, setRespuesta] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    const hacerPregunta = async (pregunta) => {
        setCargando(true);
        setError(null);
        try {
            const result = await enviarPregunta(pregunta);
            setRespuesta(result);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setCargando(false);
        }
    };

    return { respuesta, cargando, error, hacerPregunta };
}

/**
 * EJEMPLO 6: Uso del Hook
 */
export function ComponenteConHook() {
    const { respuesta, cargando, error, hacerPregunta } = useIA();
    const [pregunta, setPregunta] = useState('');

    const manejar = async () => {
        await hacerPregunta(pregunta);
    };

    return (
        <div>
            <input
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                placeholder="Tu pregunta..."
            />
            <button onClick={manejar} disabled={cargando}>
                Consultar IA
            </button>

            {cargando && <p>Cargando...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {respuesta && <p>IA: {respuesta.respuesta}</p>}
        </div>
    );
}
