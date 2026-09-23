'use strict';

/**
 * Table `instance_networks` — pivot many-to-many entre `instances` et
 * `networks` (référentiel générique du module settings) : une instance
 * peut avoir plusieurs dépendances réseau. Clé primaire composite
 * (instance_id, network_id) — même principe que `instance_hostings`
 * (20260721090060) et `instance_environments` (20260718170000).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('instance_networks', {
      instance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'instances', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      network_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'networks', key: 'id' },
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
    await queryInterface.dropTable('instance_networks');
  },
};
