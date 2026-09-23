'use strict';

/**
 * Seeder admin : crée un utilisateur + des identifiants de connexion
 * afin de pouvoir tester le flux d'authentification OTP (request-otp,
 * verify-otp, refresh, logout, profil) sans passer par un endpoint
 * d'inscription (hors périmètre du module auth actuel).
 *
 * Identifiants pilotés par `ADMIN_EMAIL`/`ADMIN_LOGIN` (variables
 * d'environnement, cf. backend/.env) — repli sur des valeurs de
 * développement si absentes, pour ne pas casser le workflow local
 * existant. En production, définir ces deux variables avant de seeder :
 * aucune édition du code n'est nécessaire. L'email doit être une boîte
 * réellement accessible — c'est là que le code OTP de connexion est
 * envoyé (aucun mot de passe).
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'joelmaniofficiel@gmail.com';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        first_name: 'Admin',
        last_name: 'ServiceHub',
        email: ADMIN_EMAIL,
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
        login: ADMIN_LOGIN,
        email: ADMIN_EMAIL,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    const [[credential]] = await queryInterface.sequelize.query(
      `SELECT user_id AS userId FROM credentials WHERE email = '${ADMIN_EMAIL}'`
    );

    await queryInterface.bulkDelete('credentials', { email: ADMIN_EMAIL });

    if (credential) {
      await queryInterface.bulkDelete('users', { id: credential.userId });
    }
  },
};
