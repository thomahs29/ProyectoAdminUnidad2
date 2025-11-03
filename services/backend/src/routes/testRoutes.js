const express = require('express');
const { sendEmail } = require('../services/mailService');

const router = express.Router();

router.get("/test-mail", async (req, res) => {
  try {
    const info = await sendEmail({
      to: "test@example.com",
      subject: "Prueba SMTP",
      html: "<p>Esto es una prueba de envío de correo.</p>"
    });
    res.json({ msg: "Correo enviado", messageId: info.messageId });
  } catch (err) {
    res.status(500).json({ msg: "Fallo al enviar correo", error: err.message });
  }
});

module.exports = router;