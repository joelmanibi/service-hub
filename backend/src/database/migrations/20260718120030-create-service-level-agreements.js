'use strict';

/**
 * Table `service_level_agreements` — un SLA par couple (service, priorité).
 * Normalisée séparément de `services` car un service peut avoir 0 à N SLA
 * (une colonne par priorité sur `services` violerait la 1FN).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_level_agreements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      service_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'services', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
      },
      response_time_hours: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
      },
      resolution_time_hours: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
      },
      availability_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 99.9,
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

    await queryInterface.addConstraint('service_level_agreements', {
      fields: ['service_id', 'priority'],
      type: 'unique',
      name: 'service_level_agreements_service_id_priority_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('service_level_agreements');
  },
};
