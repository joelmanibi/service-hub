'use strict';

/**
 * Remplace l'authentification par mot de passe par l'authentification
 * OTP (module auth) :
 *  - + login (obligatoire, unique) : second identifiant de connexion
 *    possible en plus de l'email (cf. module UserOtp,
 *    20260721100000-create-user-otps.js).
 *  - − password_hash : devenu inutile, le mot de passe est remplacé par
 *    un code OTP envoyé par email.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('credentials', 'login', {
      type: Sequelize.STRING(60),
      allowNull: false,
      unique: true,
    });

    await queryInterface.removeColumn('credentials', 'password_hash');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('credentials', 'password_hash', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    await queryInterface.removeColumn('credentials', 'login');
  },
};
