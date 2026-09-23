'use strict';

/**
 * Ajoute à `users` :
 *  - role (ENUM ADMIN/VALIDATOR/USER, obligatoire, défaut USER) : les
 *    trois seuls rôles applicatifs (module users).
 *  - deleted_at : active la suppression douce (paranoid) — un
 *    utilisateur n'est jamais supprimé physiquement.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('ADMIN', 'VALIDATOR', 'USER'),
      allowNull: false,
      defaultValue: 'USER',
    });

    await queryInterface.addColumn('users', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'deleted_at');
    await queryInterface.removeColumn('users', 'role');
  },
};
