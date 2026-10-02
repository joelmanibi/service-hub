'use strict';

/**
 * Demandes de clés d'API et propriété des clés.
 *  - `api_keys.owner_user_id` : utilisateur à qui la clé est attribuée (le
 *    demandeur, pour une clé issue d'une demande approuvée) — seul lui et
 *    les ADMIN peuvent afficher la clé.
 *  - `api_keys.key_encrypted` : copie chiffrée (AES-256-GCM) de la clé,
 *    pour permettre cet affichage ; l'authentification continue de se faire
 *    par l'empreinte `key_hash`. NULL pour les clés créées avant cette
 *    migration (non récupérables).
 *  - Table `api_key_requests` : demande faite depuis le site public par un
 *    utilisateur connecté, approuvée ou refusée par un ADMIN.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('api_keys', 'owner_user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('api_keys', 'key_encrypted', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.createTable('api_key_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      requester_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      application_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      usage_description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      validity_days: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      reviewed_by_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      rejection_reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      api_key_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'api_keys', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('api_key_requests', ['status']);
    await queryInterface.addIndex('api_key_requests', ['requester_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('api_key_requests');
    await queryInterface.removeColumn('api_keys', 'key_encrypted');
    await queryInterface.removeColumn('api_keys', 'owner_user_id');
  },
};
