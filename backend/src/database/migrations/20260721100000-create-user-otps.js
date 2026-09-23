'use strict';

/**
 * Table `user_otps` — codes OTP envoyés par email pour l'authentification
 * (module auth). Un utilisateur peut accumuler plusieurs lignes dans le
 * temps (historique des codes émis), chaque code n'étant utilisable
 * qu'une fois (`used_at`) et expirant 60 secondes après sa création
 * (`expires_at`, calculé côté application au moment de l'insertion).
 *
 * Les règles "un seul OTP actif à la fois" et le verrouillage après
 * plusieurs tentatives (`attempts`) dépendent de l'heure courante et de
 * l'historique des lignes : elles ne sont pas exprimables en contrainte
 * SQL statique (MySQL ne supporte pas les index uniques partiels/filtrés
 * comme Postgres) et devront être appliquées par la couche service, hors
 * périmètre de cette migration.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_otps', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      otp_code: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.dropTable('user_otps');
  },
};
