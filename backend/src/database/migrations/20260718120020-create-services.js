'use strict';

/**
 * Table `services` — le produit/l'application générique du catalogue
 * (ex: "Maxit"), sans notion de pays, d'environnement ni de statut de
 * production : ces aspects appartiennent désormais à `instances`.
 *
 * `service_type_id` est volontairement créé ici SANS contrainte de clé
 * étrangère : la table `service_types` (module settings) n'est créée que
 * plus tard dans l'ordre des migrations. La contrainte est ajoutée par
 * 20260718160000-add-service-type-fk-to-services.js, une fois
 * `service_types` disponible.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      service_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('services');
  },
};
