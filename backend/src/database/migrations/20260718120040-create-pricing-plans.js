'use strict';

/**
 * Table `pricing_plans` — un service peut proposer plusieurs plans
 * tarifaires (ex: Standard/Premium, mensuel/annuel/à l'usage).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pricing_plans', {
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
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'EUR',
      },
      billing_cycle: {
        type: Sequelize.ENUM('one_time', 'monthly', 'yearly', 'per_use'),
        allowNull: false,
        defaultValue: 'monthly',
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.dropTable('pricing_plans');
  },
};
