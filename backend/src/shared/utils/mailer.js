const nodemailer = require('nodemailer');

const mailerConfig = require('../../config/mailer');

/**
 * Transport SMTP bas niveau.
 * Responsabilité : exposer un point d'envoi générique (transport
 * configuré une seule fois, à la première utilisation), sur l'un des
 * deux fournisseurs supportés (MAIL_PROVIDER) :
 *  - 'gmail'  compte Gmail + mot de passe d'application (GMAIL_USER/
 *             GMAIL_PASS) — nodemailer connaît nativement
 *             `service: 'gmail'`, pas besoin de host/port.
 *  - 'smtp'   serveur SMTP générique (SMTP_HOST/PORT/...), utilisé par
 *             défaut.
 * Ne contient aucune logique métier ni gabarit de contenu — c'est le
 * rôle d'emailService.js, qui compose sujet/texte/HTML par
 * fonctionnalité (OTP aujourd'hui, d'autres demain) et délègue l'envoi
 * ici. Aucun module métier ne doit appeler `sendMail` directement.
 */

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter =
      mailerConfig.provider === 'gmail'
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: { user: mailerConfig.gmail.user, pass: mailerConfig.gmail.pass },
          })
        : nodemailer.createTransport({
            host: mailerConfig.host,
            port: mailerConfig.port,
            secure: mailerConfig.secure,
            auth: mailerConfig.user ? { user: mailerConfig.user, pass: mailerConfig.password } : undefined,
            tls: { rejectUnauthorized: mailerConfig.tlsRejectUnauthorized },
          });
  }

  return transporter;
}

function getFromAddress() {
  // Gmail exige (sauf alias configuré côté compte) que l'expéditeur
  // corresponde au compte authentifié.
  return mailerConfig.provider === 'gmail' ? mailerConfig.gmail.user : mailerConfig.from;
}

async function sendMail({ to, subject, text, html }) {
  await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendMail };
