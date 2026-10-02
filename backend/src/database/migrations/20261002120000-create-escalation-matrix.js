'use strict';

/**
 * Matrice d'escalade GOS.
 *  - `app_settings` (clé / valeur JSON sérialisée en TEXT — compatible
 *    MySQL et MariaDB) : paramètres globaux uniques. Deux clés ici :
 *      · `escalation.managerial` : escalade managériale, identique pour
 *        tous les services (disponibilité, heures ouvrées, EDS, niveaux
 *        L1..Ln avec contact, téléphones, email) ;
 *      · `escalation.technical_normal` : ligne « Normal Process » de
 *        l'escalade technique (Service Desk & Monitoring), commune à tous.
 *  - `pod_escalations` : ligne « Technical escalation » propre à chaque POD
 *    (pays couverts, Quality Analyst, Head of Cluster) — celle de l'instance
 *    est choisie d'après son POD.
 * Pré-remplie avec la matrice GOS en vigueur.
 */

const MANAGERIAL = {
  intro: 'GOS provides L1 & L2 support during business and non business hours',
  availability: '24/7',
  businessHours: 'Monday - Friday 08h-17h GMT',
  eds: '555402',
  note: "Un client peut escalader sa requête au niveau supérieur lorsqu'il est insatisfait",
  levels: [
    {
      level: 'Escalation L1',
      contact: "N'GUESSAN Thomas",
      phones: [
        { label: 'F', number: '+225 27 20 34 86 54' },
        { label: 'M', number: '+225 07 08 04 23 18' },
      ],
      email: 'thomas.nguessan@orange.com',
    },
    {
      level: 'Escalation L2',
      contact: 'HAMZA Salah',
      phones: [{ label: 'M', number: '+225 07 07 00 16 42' }],
      email: 'Salah.Hamza@orange.com',
    },
    {
      level: 'Escalation L3',
      contact: 'SAKHO Mactar Mamadou (CEO)',
      phones: [
        { label: 'F', number: '+225 27 20 34 70 65' },
        { label: 'M', number: '+225 07 00 90 00 45' },
      ],
      email: 'mactar.sakho@orange.com',
    },
  ],
};

const TECHNICAL_NORMAL = {
  intro: 'GOS provides L1 & L2 support during business and non business hours',
  cluster: 'Service Desk & Monitoring',
  countries: 'All Countries\nAll Partners',
  qualityAnalyst: {
    name: 'Service desk',
    email: 'supervision.gos@orange.com',
    phones: [
      { label: 'F', number: '+225 27 20 34 51 12' },
      { label: 'F', number: '+225 27 20 34 54 07' },
    ],
  },
  headOfCluster: {
    name: "N'GUESSAN Thomas",
    email: 'thomas.nguessan@orange.com',
    phones: [{ label: 'M', number: '+225 07 08 04 23 18' }],
  },
};

const MENA = {
  countries: 'Orange Tunisia\nOrange Maroc\nOrange Jordan',
  qualityAnalyst: {
    name: 'SHITTU ADAMA',
    email: 'adama.shittu@orange.com',
    phones: [{ label: 'M', number: '+225 07 08 46 83 54' }],
  },
  headOfCluster: {
    name: 'KOUAKOU Alexis',
    email: 'alexis.kouakou@orange.com',
    phones: [{ label: 'M', number: '+225 07 47 44 67 45' }],
  },
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('app_settings', {
      key: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        allowNull: false,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable('pod_escalations', {
      pod_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'pods', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      countries: { type: Sequelize.TEXT, allowNull: true },
      quality_analyst: { type: Sequelize.TEXT, allowNull: true },
      head_of_cluster: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    const now = new Date();
    await queryInterface.bulkInsert('app_settings', [
      { key: 'escalation.managerial', value: JSON.stringify(MANAGERIAL), created_at: now, updated_at: now },
      { key: 'escalation.technical_normal', value: JSON.stringify(TECHNICAL_NORMAL), created_at: now, updated_at: now },
    ]);

    const [pods] = await queryInterface.sequelize.query("SELECT id FROM pods WHERE code = 'MENA' LIMIT 1");
    if (pods.length > 0) {
      await queryInterface.bulkInsert('pod_escalations', [
        {
          pod_id: pods[0].id,
          countries: MENA.countries,
          quality_analyst: JSON.stringify(MENA.qualityAnalyst),
          head_of_cluster: JSON.stringify(MENA.headOfCluster),
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pod_escalations');
    await queryInterface.dropTable('app_settings');
  },
};
