const { sendEmailAsync } = require('../services/mailService');
const pool = require('../config/db');

const enviarNotificacionMasiva = async (req, res) => {
    try {
        const { tipo, mensaje, destinatarios } = req.body;

        console.log('=== ENVIAR NOTIFICACIÓN MASIVA ===');
        console.log('Tipo:', tipo);
        console.log('Mensaje:', mensaje);
        console.log('Destinatarios recibidos:', JSON.stringify(destinatarios, null, 2));

        if (!mensaje || !destinatarios || destinatarios.length === 0) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        console.log(`Enviando ${tipo} a ${destinatarios.length} destinatarios`);

        // Enviar email a cada destinatario con delay para respetar límites de Mailtrap
        let enviados = 0;
        for (let idx = 0; idx < destinatarios.length; idx++) {
            const destinatario = destinatarios[idx];
            
            console.log(`[${idx + 1}/${destinatarios.length}] Enviando a: ${destinatario.email} - ${destinatario.nombre}`);
            
            if (!destinatario.email) {
                console.warn(`⚠️ Destinatario sin email: ${destinatario.nombre}`);
                continue;
            }

            const htmlContent = generarHTMLNotificacion(tipo, mensaje, destinatario.nombre);
            
            sendEmailAsync({
                to: destinatario.email,
                subject: generarAsuntoNotificacion(tipo),
                html: htmlContent
            });
            
            enviados++;
            
            // Agregar delay de 1 segundo entre cada email (para respetar límites de Mailtrap)
            if (idx < destinatarios.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        res.status(200).json({
            message: `Notificación enviada a ${enviados} contribuyente(s)`,
            enviados: enviados
        });
    } catch (error) {
        console.error('Error al enviar notificación:', error);
        res.status(500).json({ message: 'Error al enviar notificación', error: error.message });
    }
};

const generarAsuntoNotificacion = (tipo) => {
    const asuntos = {
        'documentos_faltantes': '⚠️ Documentos Faltantes - Municipalidad de Linares',
        'hora_confirmada': '✅ Tu Hora ha sido Confirmada - Municipalidad de Linares',
        'recordatorio': '📅 Recordatorio de Cita - Municipalidad de Linares',
        'general': '📧 Notificación Importante - Municipalidad de Linares'
    };
    return asuntos[tipo] || 'Notificación - Municipalidad de Linares';
};

const generarHTMLNotificacion = (tipo, mensaje, nombre) => {
    const layout = (title, body) => `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;padding:16px;border:1px solid #eee">
        <h2 style="color:#0d47a1">${title}</h2>
        <div style="line-height:1.6;color:#333">${body}</div>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />
        <p style="font-size:12px;color:#777">
          Municipalidad de Linares – Departamento de Tránsito<br/>
          Este es un mensaje automático, por favor no responder a este correo.
        </p>
      </div>
    `;

    const iconos = {
        'documentos_faltantes': '⚠️',
        'hora_confirmada': '✅',
        'recordatorio': '📅',
        'general': '📧'
    };

    const titulos = {
        'documentos_faltantes': 'Documentos Faltantes',
        'hora_confirmada': 'Hora Confirmada',
        'recordatorio': 'Recordatorio de Cita',
        'general': 'Notificación Importante'
    };

    const body = `
        <p>Hola <b>${nombre}</b>,</p>
        <div style="background-color:#f5f5f5;padding:16px;border-radius:4px;margin:16px 0">
            ${mensaje}
        </div>
        <p>Si tienes preguntas o necesitas más información, no dudes en contactarnos.</p>
    `;

    return layout(
        `${iconos[tipo] || '📧'} ${titulos[tipo] || 'Notificación'}`,
        body
    );
};

module.exports = {
    enviarNotificacionMasiva,
    generarAsuntoNotificacion,
    generarHTMLNotificacion
};
