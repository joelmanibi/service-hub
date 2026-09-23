'use strict';

/**
 * Ajoute `cloud_service_model_id` à `services` : un service peut être
 * rattaché à un modèle de service cloud (référentiel
 * `cloud_service_models` — IaaS/PaaS/SaaS/FaaS/CaaS), optionnel.
 * `onDelete: 'SET NULL'` (et non CASCADE ni RESTRICT) : la suppression
 * d'un modèle de service cloud ne doit ni supprimer le service qui le
 * référence, ni être bloquée — seulement détacher le lien.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('services', 'cloud_service_model_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'cloud_service_models', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('services', ['cloud_service_model_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('services', 'cloud_service_model_id');
  },
};
