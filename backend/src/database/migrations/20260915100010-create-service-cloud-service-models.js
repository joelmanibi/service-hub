'use strict';

/**
 * Table `service_cloud_service_models` — pivot many-to-many entre
 * `services` et `cloud_service_models` : un service peut être rattaché à
 * plusieurs modèles de service cloud (IaaS/PaaS/SaaS/FaaS/CaaS), clé
 * primaire composite (service_id, cloud_service_model_id) — même
 * principe que `service_tags` (20260718120060).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_cloud_service_models', {
      service_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'services', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cloud_service_model_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'cloud_service_models', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('service_cloud_service_models');
  },
};
