'use strict';

/**
 * Renomme instances.current_state_id en statut_instance_id (cohérence
 * avec le renommage current_states → statut_instances) et le rend
 * obligatoire : une Instance possède désormais toujours un seul
 * StatutInstance (auparavant nullable / SET NULL sur suppression).
 *
 * La contrainte FK d'origine (posée en ligne dans create-instances.js)
 * porte ON DELETE SET NULL, incompatible avec une colonne NOT NULL —
 * MySQL refuse ce changement tant qu'elle existe. On la retrouve
 * dynamiquement (son nom auto-généré par MySQL n'est pas garanti stable
 * d'un environnement à l'autre) puis on la remplace par une contrainte
 * ON DELETE RESTRICT, cohérente avec une colonne obligatoire.
 *
 * `up` est idempotent sur le renommage : si une exécution précédente a
 * échoué après le renommage mais avant la suite (cas réel rencontré),
 * la relancer ne retente pas un renommage déjà effectué.
 */

async function findForeignKeyConstraint(queryInterface, column) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'instances'
       AND COLUMN_NAME = :column
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    { replacements: { column } }
  );

  return rows.map((row) => row.CONSTRAINT_NAME);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('instances');

    if (table.current_state_id && !table.statut_instance_id) {
      await queryInterface.renameColumn('instances', 'current_state_id', 'statut_instance_id');
    }

    const existingConstraints = await findForeignKeyConstraint(queryInterface, 'statut_instance_id');
    for (const constraintName of existingConstraints) {
      await queryInterface.removeConstraint('instances', constraintName);
    }

    await queryInterface.changeColumn('instances', 'statut_instance_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.addConstraint('instances', {
      fields: ['statut_instance_id'],
      type: 'foreign key',
      name: 'instances_statut_instance_id_fkey',
      references: { table: 'statut_instances', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('instances', 'instances_statut_instance_id_fkey');

    await queryInterface.changeColumn('instances', 'statut_instance_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addConstraint('instances', {
      fields: ['statut_instance_id'],
      type: 'foreign key',
      name: 'instances_statut_instance_id_fkey',
      references: { table: 'statut_instances', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.renameColumn('instances', 'statut_instance_id', 'current_state_id');
  },
};
