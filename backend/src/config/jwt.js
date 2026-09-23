const { jwt } = require('./env');

/**
 * Configuration JWT de l'application.
 * Responsabilité : exposer le secret et la durée de validité des tokens,
 * à consommer par le module `auth` (aucune logique de signature/vérification
 * ici, uniquement la configuration).
 */

module.exports = jwt;
