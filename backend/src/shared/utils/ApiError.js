/**
 * Classe d'erreur applicative standardisée.
 * Responsabilité : représenter une erreur métier ou HTTP de façon
 * homogène (statut + message) afin d'être interceptée et formatée par
 * le middleware `errorHandler`. Utilisée par tous les modules.
 */

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
