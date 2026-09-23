'use strict';

/**
 * Table `support_levels` — référentiel générique (module settings) : les
 * niveaux de support pouvant être assignés à une instance (Support niveau
 * 1, Support applicatif, Support infra, Support base de données, Support
 * niveau 3...). Même forme que les autres référentiels génériques
 * (name/code/description) — voir 20260718150000-create-countries.js pour
 * le choix de ne pas poser de contrainte UNIQUE en base sur name/code
 * (incompatible avec le soft delete sous MySQL).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('support_levels', {
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

    await queryInterface.addIndex('support_levels', ['name']);
    await queryInterface.addIndex('support_levels', ['code']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('support_levels');
  },
};
