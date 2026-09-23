'use strict';

/**
 * Ajoute instances.pod_id (obligatoire) : chaque Instance appartient
 * toujours à un Pod exactement. Sème les pods connus au moment du
 * refactoring (WECA, MENA, WEA, MS, B2B) et rattache les instances
 * existantes à WECA (seule instance en base au moment de cette migration :
 * MAXIT OCI, Orange Côte d'Ivoire) avant de rendre la colonne obligatoire —
 * ajouter directement une colonne NOT NULL sur une table non vide échoue.
 */

const PODS = ['WECA', 'MENA', 'WEA', 'MS', 'B2B'];

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert(
      'pods',
      PODS.map((code) => ({ name: code, code, description: null, created_at: now, updated_at: now }))
    );

    await queryInterface.addColumn('instances', 'pod_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'pods', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    const [weca] = await queryInterface.sequelize.query("SELECT id FROM pods WHERE code = 'WECA' LIMIT 1", {
      type: Sequelize.QueryTypes.SELECT,
    });
    await queryInterface.bulkUpdate('instances', { pod_id: weca.id }, { pod_id: null });

    await queryInterface.changeColumn('instances', 'pod_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'pods', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('instances', 'pod_id');
    await queryInterface.bulkDelete('pods', { code: PODS });
  },
};
