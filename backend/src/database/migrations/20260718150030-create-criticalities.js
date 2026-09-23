'use strict';

/**
 * Table `criticalities` — référentiel générique (module settings).
 * Voir 20260718150000-create-countries.js pour le choix de ne pas poser
 * de contrainte UNIQUE en base sur name/code (incompatible avec le soft
 * delete sous MySQL).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('criticalities', {
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

    await queryInterface.addIndex('criticalities', ['name']);
    await queryInterface.addIndex('criticalities', ['code']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('criticalities');
  },
};
