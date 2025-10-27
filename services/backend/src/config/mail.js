const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    },
    secure: false,
});

const MAIL_DEFAULTS = {
    from: process.env.MAIL_FROM || "no-reply@linares.cl",
    replyTo: process.env.MAIL_REPLY_TO || process.env.MAIL_FROM
};

module.exports = { transporter, MAIL_DEFAULTS };
