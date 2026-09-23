'use strict';

/**
 * Table `users` — version minimale (id + timestamps).
 * Les champs métier (email, mot de passe, rôle...) seront ajoutés par
 * une migration ultérieure lors du développement du module auth/users.
 * Créée dès maintenant pour porter la FK services.owner_id.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
    await queryInterface.dropTable('users');
  },
};
