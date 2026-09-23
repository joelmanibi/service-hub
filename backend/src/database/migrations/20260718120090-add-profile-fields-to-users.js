'use strict';

/**
 * Ajoute les champs profil à `users` (créée initialement avec seulement
 * id + timestamps pour porter les FK des modules auth/catalog). Migration
 * séparée plutôt que modification de la migration d'origine, conformément
 * à l'usage : une migration déjà écrite ne se modifie pas, elle s'étend.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'first_name', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });

    await queryInterface.addColumn('users', 'last_name', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });

    await queryInterface.addColumn('users', 'email', {
      type: Sequelize.STRING(150),
      allowNull: false,
      unique: true,
    });

    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(30),
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'first_name');
    await queryInterface.removeColumn('users', 'last_name');
    await queryInterface.removeColumn('users', 'email');
    await queryInterface.removeColumn('users', 'phone');
    await queryInterface.removeColumn('users', 'is_active');
  },
};
