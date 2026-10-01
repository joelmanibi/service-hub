'use strict';

/**
 * Table `api_keys` — clés d'API des applications tierces (module
 * Integration), générées et révoquées depuis l'interface d'administration
 * (module apikey). La clé en clair n'est jamais stockée : seulement son
 * empreinte SHA-256 (`key_hash`, unique — sert à la vérification) et ses
 * premiers caractères (`key_prefix`, pour la reconnaître dans la liste).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('api_keys', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      key_prefix: {
        type: Sequelize.STRING(16),
        allowNull: false,
      },
      key_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      created_by_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_used_ip: {
        type: Sequelize.STRING(45),
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
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('api_keys');
  },
};
