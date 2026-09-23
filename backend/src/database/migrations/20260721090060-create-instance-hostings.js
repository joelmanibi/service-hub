'use strict';

/**
 * Table `instance_hostings` — pivot many-to-many entre `instances` et
 * `hostings` (référentiel générique du module settings) : une instance
 * peut être hébergée sur plusieurs sites. Clé primaire composite
 * (instance_id, hosting_id) — aucune liste JSON stockée sur `instances`.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('instance_hostings', {
      instance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'instances', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      hosting_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('instance_hostings');
  },
};
