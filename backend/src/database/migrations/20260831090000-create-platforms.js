'use strict';

/**
 * Table `platforms` — plateforme(s) d'un Hébergement (module settings) :
 * un Hébergement/site peut avoir plusieurs plateformes, chacune propre à
 * ce seul hébergement (pas de partage entre hébergements, contrairement
 * aux référentiels génériques du module settings — même principe que
 * `composants` vis-à-vis d'une Instance). Suppression en cascade avec
 * l'hébergement parent.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('platforms', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      hosting_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'hostings', key: 'id' },
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

    await queryInterface.addIndex('platforms', ['hosting_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('platforms');
  },
};
