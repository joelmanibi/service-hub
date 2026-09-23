'use strict';

/**
 * Table `composants` — composant(s) d'une Instance (module instance) :
 * une Instance peut avoir plusieurs composants, chacun propre à cette
 * seule instance (pas de partage entre instances, contrairement aux
 * référentiels du module settings). Suppression en cascade avec
 * l'instance parente.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('composants', {
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
      instance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'instances', key: 'id' },
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

    await queryInterface.addIndex('composants', ['instance_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('composants');
  },
};
