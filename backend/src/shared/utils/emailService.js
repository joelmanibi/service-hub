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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Informe un utilisateur que son compte ServiceHub vient d'être créé et
 * lui donne l'adresse du catalogue public des services. Pas de mot de
 * passe : la connexion se fait par code envoyé par email (OTP), avec le
 * login ou l'adresse email indiqués ici.
 */
async function sendAccountCreatedEmail({ to, name, login, publicUrl }) {
  const subject = 'Votre compte ServiceHub a été créé';

  const text = [
    `Bonjour ${name},`,
    '',
    'Votre compte ServiceHub vient d’être créé.',
    '',
    'Vous pouvez dès maintenant consulter le catalogue des services :',
    publicUrl,
    '',
    `Pour accéder aux informations réservées, cliquez sur « Se connecter » et saisissez votre identifiant (${login}) ou votre adresse email : un code de connexion vous sera envoyé par email. Aucun mot de passe n’est nécessaire.`,
    '',
    "Si vous n'attendiez pas ce message, vous pouvez l'ignorer.",
  ].join('\n');

  const safeName = escapeHtml(name);
  const safeLogin = escapeHtml(login);
  const safeUrl = escapeHtml(publicUrl);

  const html = `
<div style="font-family: Arial, Helvetica, sans-serif; color: #000; max-width: 560px; margin: 0 auto;">
  <div style="border-top: 4px solid #ff7900; padding: 24px 0 8px;">
    <p style="font-size: 18px; font-weight: bold; margin: 0 0 16px;">ServiceHub</p>
    <p>Bonjour ${safeName},</p>
    <p>Votre compte ServiceHub vient d’être créé.</p>
    <p>Vous pouvez dès maintenant consulter le <strong>catalogue des services</strong> :</p>
    <p style="margin: 24px 0;">
      <a href="${safeUrl}" style="background: #ff7900; color: #000; text-decoration: none; font-weight: bold; padding: 12px 20px; display: inline-block;">
        Accéder au catalogue
      </a>
    </p>
    <p style="font-size: 13px; color: #595959;">Ou copiez ce lien dans votre navigateur : <a href="${safeUrl}">${safeUrl}</a></p>
    <p>
      Pour accéder aux informations réservées, cliquez sur <strong>« Se connecter »</strong> et saisissez votre
      identifiant (<strong>${safeLogin}</strong>) ou votre adresse email : un code de connexion vous sera envoyé par
      email. Aucun mot de passe n’est nécessaire.
    </p>
    <p style="font-size: 13px; color: #595959; margin-top: 32px;">
      Si vous n'attendiez pas ce message, vous pouvez l'ignorer.
    </p>
  </div>
</div>`.trim();

  await sendMail({ to, subject, text, html });
}

module.exports = {
  sendOtpEmail,
  sendAccountCreatedEmail,
};
