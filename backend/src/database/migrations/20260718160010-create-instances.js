'use strict';

/**
 * Table `instances` — déploiement concret d'un Service dans un contexte
 * donné (ex: "Maxit CI"). Appartient obligatoirement à un Service et à un
 * Country ; `current_state_id` référence le référentiel settings.CurrentState
 * (nullable, SET NULL — un état supprimé ne bloque pas l'instance).
 * `deleted_at` porte la suppression douce (soft delete).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('instances', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      service_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'services', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      country_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'countries', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      current_state_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'current_states', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      comments: {
        type: Sequelize.TEXT,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('instances');
  },
};
