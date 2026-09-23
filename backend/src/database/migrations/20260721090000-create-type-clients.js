'use strict';

/**
 * Table `type_clients` — référentiel générique (module settings),
 * classification d'un Client (ex: Opérateur, Filiale, Partenaire...).
 * Introduite par le refactoring du modèle métier
 * (TypeClient → Client → Instance). Voir
 * 20260718150000-create-countries.js pour le choix de ne pas poser de
 * contrainte UNIQUE en base sur name/code (incompatible avec le soft
 * delete sous MySQL).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('type_clients', {
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

    await queryInterface.addIndex('type_clients', ['name']);
    await queryInterface.addIndex('type_clients', ['code']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('type_clients');
  },
};
