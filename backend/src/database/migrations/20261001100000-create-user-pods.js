'use strict';

/**
 * Table `user_pods` — pivot many-to-many entre `users` et `pods`
 * (référentiel du module settings) : un utilisateur peut être rattaché à
 * un ou plusieurs pods. Clé primaire composite (user_id, pod_id) — même
 * principe que `instance_hostings` / `instance_networks`.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_pods', {
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      pod_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'pods', key: 'id' },
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

    await queryInterface.addIndex('user_pods', ['pod_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_pods');
  },
};
