const { mailer } = require('./env');

/**
 * Configuration mailer (SMTP) de l'application.
 * Responsabilité : exposer les paramètres de connexion SMTP à consommer
 * par shared/utils/mailer.js (aucune logique d'envoi ici, uniquement la
 * configuration).
 */

module.exports = mailer;
