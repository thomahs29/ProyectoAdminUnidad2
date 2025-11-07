import { useEffect, useRef, useState } from 'react';
import { enviarPregunta, obtenerFAQs } from '../services/aiService';
import './AIChat.css';

export default function AIChat() {
    const [mensajes, setMensajes] = useState([
        {
            id: 1,
            tipo: 'bot',
            contenido: '¡Hola! Soy el asistente de la Municipalidad de Linares. ¿En qué puedo ayudarte con tu licencia de conducir o trámites municipales?',
        },
    ]);
    const [inputPregunta, setInputPregunta] = useState('');
    const [cargando, setCargando] = useState(false);
    const [faqs, setFaqs] = useState([]);
    const mesajesFinalRef = useRef(null);

    // Cargar FAQs al montar
    useEffect(() => {
        cargarFAQs();
    }, []);

    // Scroll automático al último mensaje
    useEffect(() => {
        mesajesFinalRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensajes]);

    const cargarFAQs = async () => {
        try {
            const faqsData = await obtenerFAQs();
            setFaqs(faqsData);
        } catch (error) {
            console.error('Error cargando FAQs:', error);
        }
    };

    const manejarEnvioPregunta = async (e) => {
        e.preventDefault();

        if (!inputPregunta.trim()) return;

        // Agregar pregunta del usuario al chat
        const nuevoPregunta = {
            id: mensajes.length + 1,
            tipo: 'usuario',
            contenido: inputPregunta,
        };

        setMensajes([...mensajes, nuevoPregunta]);
        setInputPregunta('');
        setCargando(true);

        try {
            // Enviar pregunta a la IA
            const respuesta = await enviarPregunta(inputPregunta);

            const nuevoRespuesta = {
                id: mensajes.length + 2,
                tipo: 'bot',
                contenido: respuesta.respuesta,
                modelo: respuesta.modelo,
            };

            setMensajes((prev) => [...prev, nuevoRespuesta]);
        } catch (error) {
            const errorRespuesta = {
                id: mensajes.length + 2,
                tipo: 'error',
                contenido: 'Disculpa, hubo un error procesando tu pregunta. Intenta nuevamente.',
            };
            setMensajes((prev) => [...prev, errorRespuesta]);
        } finally {
            setCargando(false);
        }
    };

    const manejarSeleccionFAQ = async (faq) => {
        // Manejar tanto FAQs (objeto) como sugerencias (string)
        const preguntaTexto = typeof faq === 'string' ? faq : faq.pregunta;
        
        const nuevoPregunta = {
            id: mensajes.length + 1,
            tipo: 'usuario',
            contenido: preguntaTexto,
        };

        setMensajes((prev) => [...prev, nuevoPregunta]);
        setCargando(true);

        try {
            // Verificar si la pregunta es específicamente sobre vencimiento/expiración de licencia
            const esPrefiuntaLicencia = /vence|vencimiento|expiración|caducid|cuándo vence|cuándo expira/i.test(preguntaTexto);
            
            // Si es pregunta sobre licencia, SIEMPRE ir al backend
            // Si es otra FAQ, mostrar respuesta preformulada
            if (!esPrefiuntaLicencia && typeof faq === 'object' && faq.respuesta) {
                const nuevoRespuesta = {
                    id: mensajes.length + 2,
                    tipo: 'bot',
                    contenido: faq.respuesta,
                    esFAQ: true,
                };
                setMensajes((prev) => [...prev, nuevoRespuesta]);
            } else {
                // Ir al backend para procesar
                const respuesta = await enviarPregunta(preguntaTexto);
                const nuevoRespuesta = {
                    id: mensajes.length + 2,
                    tipo: 'bot',
                    contenido: respuesta.respuesta,
                    modelo: respuesta.modelo,
                };
                setMensajes((prev) => [...prev, nuevoRespuesta]);
            }
        } catch (error) {
            const errorRespuesta = {
                id: mensajes.length + 2,
                tipo: 'error',
                contenido: 'Disculpa, hubo un error procesando tu pregunta. Intenta nuevamente.',
            };
            setMensajes((prev) => [...prev, errorRespuesta]);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="ai-chat-container">
            <div className="ai-chat-header">
                <h2> Preguntas sobre Licencias de Conducir</h2>
                <p>Resuelve tus dudas sobre trámites y licencias</p>
            </div>

            <div className="ai-chat-messages">
                {mensajes.map((msg) => (
                    <div key={msg.id} className={`mensaje mensaje-${msg.tipo}`}>
                        <div className="mensaje-contenido">
                            {msg.contenido}
                        </div>
                    </div>
                ))}

                {cargando && (
                    <div className="mensaje mensaje-bot mensaje-cargando">
                        <div className="spinner"></div>
                        <span>Analizando tu pregunta...</span>
                    </div>
                )}

                {faqs.length > 0 && (
                    <div className="faqs-sugerencias">
                        <h3>📚 Preguntas Frecuentes</h3>
                        <div className="faqs-grid">
                            {faqs.slice(0, 3).map((faq, index) => (
                                <button
                                    key={index}
                                    className="faq-boton"
                                    onClick={() => manejarSeleccionFAQ(faq)}
                                    title={typeof faq === 'string' ? faq : faq.pregunta}
                                >
                                    <strong>{typeof faq === 'string' ? faq : faq.pregunta}</strong>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div ref={mesajesFinalRef} />
            </div>

            <form onSubmit={manejarEnvioPregunta} className="ai-chat-input-form">
                <input
                    type="text"
                    value={inputPregunta}
                    onChange={(e) => setInputPregunta(e.target.value)}
                    placeholder="Escribe tu pregunta aquí..."
                    disabled={cargando}
                    className="ai-chat-input"
                />
                <button
                    type="submit"
                    disabled={cargando || !inputPregunta.trim()}
                    className="ai-chat-submit"
                >
                    {cargando ? '⏳' : '📤'} Enviar
                </button>
            </form>
        </div>
    );
}
