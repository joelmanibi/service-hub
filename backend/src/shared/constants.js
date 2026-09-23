/**
 * Constantes transverses de l'application.
 * Responsabilité : centraliser les valeurs partagées entre tous les
 * modules (codes de statut HTTP, rôles, etc.) afin d'éviter les valeurs
 * magiques dispersées dans le code. Ne contient aucune constante propre
 * à un module métier en particulier.
 */

module.exports = {
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Les trois seuls rôles applicatifs (module users). Fixes et fermés —
  // pas de référentiel dynamique, un ENUM en base suffit (users.role).
  ROLES: {
    ADMIN: 'ADMIN',
    VALIDATOR: 'VALIDATOR',
    USER: 'USER',
  },
};
