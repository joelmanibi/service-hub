'use strict';

/**
 * Table `current_states` — référentiel générique (module settings), état
 * opérationnel courant d'une Instance (ex: Actif, En maintenance, Hors
 * service...). Voir 20260718150000-create-countries.js pour le choix de
 * ne pas poser de contrainte UNIQUE en base sur name/code (incompatible
 * avec le soft delete sous MySQL).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('current_states', {
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
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('current_states', ['name']);
    await queryInterface.addIndex('current_states', ['code']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('current_states');
  },
};
