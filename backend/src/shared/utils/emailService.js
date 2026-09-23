const { sendMail } = require('./mailer');

/**
 * Service Email applicatif.
 * Responsabilité : composer le contenu (sujet, texte, HTML) des emails
 * envoyés par l'application — un gabarit par fonctionnalité — puis
 * déléguer l'envoi effectif à mailer.js (transport SMTP générique).
 * Indépendant de tout module métier : ne connaît ni Credential, ni User,
 * ni JWT — seulement les données déjà résolues qu'on lui passe (email,
 * nom, code...). Réutilisable par n'importe quel module (auth
 * aujourd'hui, d'autres fonctionnalités demain : il suffit d'ajouter une
 * nouvelle fonction `sendXxxEmail`, sur ce même principe).
 */

/**
 * Envoie le code OTP de connexion. Le texte du gabarit fixe "60
 * secondes" en dur : c'est la durée métier définie une fois pour toutes
 * dans shared/utils/otp.js (OTP_EXPIRY_SECONDS) — à maintenir cohérent
 * si cette durée change un jour.
 */
async function sendOtpEmail({ to, name, code }) {
  const subject = 'Votre code de connexion ServiceHub';

  const text = [
    `Bonjour ${name},`,
    '',
    'Votre code de connexion ServiceHub est :',
    '',
    code,
    '',
    'Ce code expire dans 60 secondes.',
    '',
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
  ].join('\n');

  const html = [
    `<p>Bonjour ${name},</p>`,
    '<p>Votre code de connexion ServiceHub est :</p>',
    `<p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>`,
    '<p>Ce code expire dans 60 secondes.</p>',
    "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>",
  ].join('\n');

  await sendMail({ to, subject, text, html });
}

module.exports = {
  sendOtpEmail,
};
