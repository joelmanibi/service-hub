'use strict';

/**
 * Renomme `current_states` en `statut_instances`, pour coller au
 * vocabulaire du nouveau modèle métier (StatutInstance). Aucun
 * changement de structure — la contrainte de clé étrangère
 * instances.current_state_id → current_states.id suit le renommage
 * (MySQL la rattache à la table par son id interne, pas par son nom).
 */

module.exports = {
  async up(queryInterface) {
    await queryInterface.renameTable('current_states', 'statut_instances');
  },

  async down(queryInterface) {
    await queryInterface.renameTable('statut_instances', 'current_states');
  },
};
