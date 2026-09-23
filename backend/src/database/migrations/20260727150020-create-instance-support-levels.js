'use strict';

/**
 * Table `instance_support_levels` — assignation des niveaux de support
 * (référentiel `support_levels`, module settings) à une Instance, avec le
 * responsable (équipe/personne, optionnel) pour ce niveau sur cette
 * instance. Contrairement à instance_environments/instance_hostings (pivot
 * pur, sans colonne propre), cette table porte une donnée additionnelle
 * (`responsable`) par ligne — gérée par remplacement en bloc côté service
 * (comme `composants`), pas par une association `belongsToMany` classique
 * (qui ne permet pas une donnée `through` différente par ligne). Une
 * contrainte UNIQUE (instance_id, support_level_id) empêche d'assigner
 * deux fois le même niveau de support à une même instance.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('instance_support_levels', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      instance_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'instances', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      support_level_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'support_levels', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      responsable: {
        type: Sequelize.STRING(150),
        allowNull: true,
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

    await queryInterface.addIndex('instance_support_levels', ['instance_id', 'support_level_id'], {
      unique: true,
      name: 'instance_support_levels_instance_support_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('instance_support_levels');
  },
};
