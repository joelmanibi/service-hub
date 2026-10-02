/**
 * Modèles Sequelize du module Escalation (matrice d'escalade GOS).
 *
 *  - AppSetting     paramètre global clé / valeur (JSON sérialisé en TEXT,
 *                   compatible MySQL et MariaDB). Porte l'escalade
 *                   managériale et la ligne « Normal Process » de
 *                   l'escalade technique, communes à toutes les instances.
 *  - PodEscalation  ligne « Technical escalation » d'un POD (pays couverts,
 *                   Quality Analyst, Head of Cluster). Les contacts sont des
 *                   objets { name, email, phones: [{ label, number }] }.
 */

function jsonColumn(DataTypes, column) {
  return {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue(column);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    set(value) {
      this.setDataValue(column, value === null || value === undefined ? null : JSON.stringify(value));
    },
  };
}

module.exports = (sequelize, DataTypes) => {
  const AppSetting = sequelize.define(
    'AppSetting',
    {
      key: {
        type: DataTypes.STRING(100),
        primaryKey: true,
      },
      value: { ...jsonColumn(DataTypes, 'value'), allowNull: false },
    },
    { tableName: 'app_settings' }
  );

  const PodEscalation = sequelize.define(
    'PodEscalation',
    {
      podId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      countries: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      qualityAnalyst: jsonColumn(DataTypes, 'qualityAnalyst'),
      headOfCluster: jsonColumn(DataTypes, 'headOfCluster'),
    },
    { tableName: 'pod_escalations' }
  );

  PodEscalation.associate = (models) => {
    PodEscalation.belongsTo(models.Pod, { as: 'pod', foreignKey: 'podId' });
    models.Pod.hasOne(PodEscalation, { as: 'escalation', foreignKey: 'podId' });
  };

  return { AppSetting, PodEscalation };
};
