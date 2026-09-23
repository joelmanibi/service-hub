'use strict';

/**
 * Table `instance_environments` — pivot many-to-many entre `instances`
 * et `environments` (référentiel générique du module settings) : une
 * instance peut être déployée dans plusieurs environnements (DEV, TEST,
 * UAT, PREPROD, PROD...). Clé primaire composite (instance_id,
 * environment_id) — aucune liste JSON stockée sur `instances`.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('instance_environments', {
      instance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'instances', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      environment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'environments', key: 'id' },
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
    await queryInterface.dropTable('instance_environments');
  },
};
