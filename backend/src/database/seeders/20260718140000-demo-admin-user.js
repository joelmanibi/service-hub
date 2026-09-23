'use strict';

/**
 * Seeder admin : crée un utilisateur + des identifiants de connexion
 * afin de pouvoir tester le flux d'authentification OTP (request-otp,
 * verify-otp, refresh, logout, profil) sans passer par un endpoint
 * d'inscription (hors périmètre du module auth actuel).
 *
 * Identifiants : joelmaniofficiel@gmail.com (ou login "admin") —
 * connexion par code OTP envoyé par email (aucun mot de passe). L'email
 * doit être une boîte réellement accessible : c'est là que le code OTP
 * est envoyé (MAIL_PROVIDER=gmail).
 */

const DEMO_EMAIL = 'joelmaniofficiel@gmail.com';
const DEMO_LOGIN = 'admin';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        first_name: 'Admin',
        last_name: 'ServiceHub',
        email: DEMO_EMAIL,
        role: 'ADMIN',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
    const [[{ id: userId }]] = await queryInterface.sequelize.query('SELECT LAST_INSERT_ID() AS id');

    await queryInterface.bulkInsert('credentials', [
      {
        user_id: userId,
        login: DEMO_LOGIN,
        email: DEMO_EMAIL,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    const [[credential]] = await queryInterface.sequelize.query(
      `SELECT user_id AS userId FROM credentials WHERE email = '${DEMO_EMAIL}'`
    );

    await queryInterface.bulkDelete('credentials', { email: DEMO_EMAIL });

    if (credential) {
      await queryInterface.bulkDelete('users', { id: credential.userId });
    }
  },
};
