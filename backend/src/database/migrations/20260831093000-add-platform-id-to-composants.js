'use strict';

/**
 * Ajoute `platform_id` à `composants` : un composant peut être rattaché à
 * une plateforme (référentiel `platforms`, propre à l'hébergement — cf.
 * 20260831090000-create-platforms.js), optionnel. `onDelete: 'SET NULL'`
 * (et non CASCADE) : la suppression d'une plateforme ne doit pas
 * supprimer le composant qui la référence, seulement détacher le lien.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('composants', 'platform_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'platforms', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('composants', ['platform_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('composants', 'platform_id');
  },
};
