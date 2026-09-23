'use strict';

/**
 * Table `inventaires` — inventaire(s) d'un Composant (module instance) :
 * un Composant peut avoir plusieurs inventaires (ip + nom de serveur),
 * chacun propre à ce seul composant (pas de partage, même principe que
 * Composant vis-à-vis d'Instance). Suppression en cascade avec le
 * composant parent.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventaires', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      ip: {
        type: Sequelize.STRING(45),
        allowNull: false,
      },
      nom_serveur: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      composant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'composants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    await queryInterface.addIndex('inventaires', ['composant_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inventaires');
  },
};
