const { transporter, MAIL_DEFAULTS } = require('../config/mail');

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

const tplReservaCreada = ({ nombre, fecha, hora, tramite }) =>
  layout(
    "Confirmación de reserva",
    `<p>Hola <b>${nombre}</b>,</p>
     <p>Tu reserva fue registrada con éxito.</p>
     <ul>
       <li><b>Trámite:</b> ${tramite}</li>
       <li><b>Fecha:</b> ${fecha}</li>
       <li><b>Hora:</b> ${hora}</li>
     </ul>
     <p>Recuerda presentar tus documentos requeridos.</p>`
);

const tplReservaAnulada = ({ nombre, fecha, hora, tramite }) =>
  layout(
    "Reserva anulada",
    `<p>Hola <b>${nombre}</b>,</p>
     <p>Tu reserva ha sido <b>anulada</b>.</p>
     <ul>
       <li><b>Trámite:</b> ${tramite}</li>
       <li><b>Fecha:</b> ${fecha}</li>
       <li><b>Hora:</b> ${hora}</li>
     </ul>
     <p>Si fue un error, puedes reservar nuevamente desde la plataforma.</p>`
);

const sendEmail = async ({ to, subject, html, text }) => {
  const info = await transporter.sendMail({
    ...MAIL_DEFAULTS,
    to,
    subject,
    html,
    text
  });
  return info;
};

const sendEmailAsync = (args) => {
    sendEmail(args).catch(err => {
        console.error("Error sending email:", err);
    });
}

module.exports = { sendEmail, tplReservaCreada, tplReservaAnulada, sendEmailAsync };