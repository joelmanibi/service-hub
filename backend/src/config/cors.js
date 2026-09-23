const { cors } = require('./env');

/**
 * Configuration CORS de l'application.
 * Responsabilité : exposer les options du middleware `cors` (origines
 * autorisées, méthodes, en-têtes) à partir de la configuration centralisée.
 */

module.exports = cors;
