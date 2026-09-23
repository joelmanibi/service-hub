'use strict';

/**
 * Table `countries` — référentiel générique (module settings).
 * `deleted_at` porte la suppression douce (soft delete) ; l'unicité de
 * `name`/`code` est vérifiée côté service (une contrainte UNIQUE en base
 * serait incompatible avec le soft delete sous MySQL : plusieurs lignes
 * actives partageant `deleted_at IS NULL` ne seraient pas bloquées par un
 * index composite, puisque NULL n'est jamais égal à NULL).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('countries', {
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

    await queryInterface.addIndex('countries', ['name']);
    await queryInterface.addIndex('countries', ['code']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('countries');
  },
};
