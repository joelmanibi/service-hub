'use strict';

/**
 * Retire `cloud_service_model_id` de `services` (ajoutée par
 * 20260915090010) : un service peut en réalité être rattaché à
 * plusieurs modèles de service cloud, pas un seul — remplacé par la
 * relation many-to-many portée par la table pivot
 * `service_cloud_service_models` (cf. 20260915100010).
 */

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('services', 'cloud_service_model_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('services', 'cloud_service_model_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'cloud_service_models', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('services', ['cloud_service_model_id']);
  },
};
