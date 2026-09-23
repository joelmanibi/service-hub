/**
 * Modèle Sequelize du module Users (utilisateurs).
 * Responsabilité : définir le schéma de données de l'entité User —
 * le répertoire des personnes de ServiceHub (nom, email de contact,
 * téléphone, rôle, statut actif/inactif). Distinct du module `auth`, qui
 * porte l'identifiant de connexion (Credential.login/email, OTP) : un
 * User peut exister sans jamais se connecter (ex: bénéficiaire d'un
 * service).
 *
 * `paranoid: true` : suppression douce (soft delete) native de
 * Sequelize — `.destroy()` renseigne `deletedAt` au lieu de supprimer la
 * ligne. Un utilisateur n'est jamais supprimé physiquement ; la
 * désactivation (`isActive`) est le mécanisme métier normal de mise
 * hors service d'un compte.
 */

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('ADMIN', 'VALIDATOR', 'USER'),
        allowNull: false,
        defaultValue: 'USER',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'users',
      paranoid: true,
    }
  );

  // Plus d'association vers Service : le refactoring catalogue a retiré
  // la notion de responsable (ownerId) du modèle Service.

  // Association réciproque vers Credential (module auth), nécessaire
  // pour exposer le login/dernière connexion dans l'API Users (liste,
  // détail, création) sans dupliquer ces champs sur User.
  User.associate = (models) => {
    User.hasOne(models.Credential, { as: 'credential', foreignKey: 'userId' });
  };

  return User;
};
