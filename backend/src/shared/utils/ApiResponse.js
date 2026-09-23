/**
 * Formateur de réponse HTTP standardisé.
 * Responsabilité : garantir un format de réponse JSON homogène
 * (success/message/data) pour tous les endpoints de l'API, quel que
 * soit le module qui répond.
 */

class ApiResponse {
  constructor(success, message, data = null) {
    this.success = success;
    this.message = message;
    this.data = data;
  }
}

module.exports = ApiResponse;
