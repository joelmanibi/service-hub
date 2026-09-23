/**
 * Wrapper pour les contrôleurs asynchrones.
 * Responsabilité : capturer automatiquement les erreurs des fonctions
 * async des contrôleurs et les transmettre au middleware `errorHandler`,
 * afin d'éviter la répétition de blocs try/catch dans chaque module.
 */

module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
