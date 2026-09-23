const db = require('../../database');

const { Instance, Service, ServiceType, Environment, Hosting, Client, Country, StatutInstance, User, InstanceEnvironment, InstanceHosting } =
  db;

/**
 * Couche service du module Dashboard (tableau de bord).
 * Responsabilité : agréger les KPI réels du catalogue (Services,
 * Instances) à partir des modules catalog/instance/settings/users —
 * aucune donnée fictive. `RUN`/`BUILD` sont les codes conventionnels du
 * référentiel StatutInstance (module settings) utilisés par le reste de
 * l'application (badges RecentServices/DashboardStats) ; si ces lignes
 * n'existent pas encore dans le référentiel, les compteurs correspondants
 * valent simplement 0 (état réel, pas une erreur).
 */

async function getStats() {
  const [totalServices, totalInstances, runCount, buildCount] = await Promise.all([
    Service.count(),
    Instance.count(),
    Instance.count({ include: [{ model: StatutInstance, as: 'statutInstance', where: { code: 'RUN' } }] }),
    Instance.count({ include: [{ model: StatutInstance, as: 'statutInstance', where: { code: 'BUILD' } }] }),
  ]);

  return { totalServices, totalInstances, runCount, buildCount };
}

// Répartition des instances par environnement (relation many-to-many
// instance_environments) — agrégée en JS plutôt qu'en SQL group-by : les
// référentiels et volumes d'instances restent modestes, et ça évite
// d'introduire du SQL brut/fn() pour un simple comptage.
async function getEnvironmentDistribution() {
  const [environments, links] = await Promise.all([
    Environment.findAll({ attributes: ['id', 'name', 'code'], order: [['name', 'ASC']] }),
    InstanceEnvironment.findAll({ attributes: ['environmentId'] }),
  ]);

  const countByEnvironmentId = links.reduce((acc, link) => {
    acc[link.environmentId] = (acc[link.environmentId] || 0) + 1;
    return acc;
  }, {});

  return environments.map((environment) => ({
    label: environment.name,
    code: environment.code,
    count: countByEnvironmentId[environment.id] || 0,
  }));
}

async function getServiceTypeDistribution() {
  const services = await Service.findAll({
    attributes: ['id'],
    include: [{ model: ServiceType, as: 'serviceType', attributes: ['id', 'name'] }],
  });

  const countByTypeName = services.reduce((acc, service) => {
    const label = service.serviceType ? service.serviceType.name : 'Non classé';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(countByTypeName)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

// La géographie vit désormais sur Client (Client.countryId), plus sur
// Instance — voir 20260721090050-remove-country-id-from-instances.js.
// La répartition "par pays" est donc calculée via Instance → Client → Country.
async function getCountryDistribution() {
  const instances = await Instance.findAll({
    attributes: ['id'],
    include: [
      {
        model: Client,
        as: 'client',
        attributes: ['id'],
        include: [{ model: Country, as: 'country', attributes: ['id', 'name', 'code'] }],
      },
    ],
  });

  const countByCountry = instances.reduce((acc, instance) => {
    const country = instance.client?.country;
    const key = country ? country.code : 'N/A';

    if (!acc[key]) {
      acc[key] = { code: key, name: country ? country.name : 'Non renseigné', count: 0 };
    }

    acc[key].count += 1;
    return acc;
  }, {});

  return Object.values(countByCountry).sort((a, b) => b.count - a.count);
}

async function getHostingDistribution() {
  const [hostings, links] = await Promise.all([
    Hosting.findAll({ attributes: ['id', 'name'], order: [['name', 'ASC']] }),
    InstanceHosting.findAll({ attributes: ['hostingId'] }),
  ]);

  const countByHostingId = links.reduce((acc, link) => {
    acc[link.hostingId] = (acc[link.hostingId] || 0) + 1;
    return acc;
  }, {});

  return hostings.map((hosting) => ({
    name: hosting.name,
    count: countByHostingId[hosting.id] || 0,
  }));
}

async function getRecentInstances(limit = 5) {
  const instances = await Instance.findAll({
    attributes: ['id', 'name', 'updatedAt'],
    include: [
      {
        model: Client,
        as: 'client',
        attributes: ['id'],
        include: [{ model: Country, as: 'country', attributes: ['name'] }],
      },
      { model: StatutInstance, as: 'statutInstance', attributes: ['code', 'name'] },
    ],
    order: [['updatedAt', 'DESC']],
    limit,
  });

  return instances.map((instance) => ({
    name: instance.name,
    country: instance.client?.country?.name ?? null,
    status: instance.statutInstance?.code ?? null,
    updatedAt: instance.updatedAt,
  }));
}

// Pas de table d'audit dédiée : le fil d'activité est reconstitué à
// partir des horodatages createdAt/updatedAt des entités les plus
// pertinentes (Instance, Client, Utilisateur). `isNew` distingue
// création/modification par simple proximité createdAt/updatedAt (< 1s),
// sans historique détaillé des changements.
function isNewlyCreated(record) {
  return Math.abs(new Date(record.updatedAt).getTime() - new Date(record.createdAt).getTime()) < 1000;
}

async function getRecentActivity(limit = 5) {
  const [instances, clients, users] = await Promise.all([
    Instance.findAll({ attributes: ['id', 'name', 'createdAt', 'updatedAt'], order: [['updatedAt', 'DESC']], limit }),
    Client.findAll({ attributes: ['id', 'name', 'createdAt', 'updatedAt'], order: [['updatedAt', 'DESC']], limit }),
    User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'createdAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit,
    }),
  ]);

  const events = [
    ...instances.map((instance) => ({
      updatedAt: instance.updatedAt,
      text: `Instance ${instance.name} ${isNewlyCreated(instance) ? 'créée' : 'modifiée'}`,
      icon: 'bi-hdd-network',
    })),
    ...clients.map((client) => ({
      updatedAt: client.updatedAt,
      text: `Client ${client.name} ${isNewlyCreated(client) ? 'créé' : 'modifié'}`,
      icon: 'bi-building',
    })),
    ...users.map((user) => ({
      updatedAt: user.updatedAt,
      text: `Utilisateur ${user.firstName} ${user.lastName} ${isNewlyCreated(user) ? 'créé' : 'modifié'}`,
      icon: 'bi-person',
    })),
  ];

  return events
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit)
    .map(({ updatedAt, text, icon }) => ({ time: updatedAt, text, icon }));
}

async function getOverview() {
  const [
    stats,
    environmentDistribution,
    serviceTypeDistribution,
    countryDistribution,
    hostingDistribution,
    recentInstances,
    recentActivity,
  ] = await Promise.all([
    getStats(),
    getEnvironmentDistribution(),
    getServiceTypeDistribution(),
    getCountryDistribution(),
    getHostingDistribution(),
    getRecentInstances(),
    getRecentActivity(),
  ]);

  return {
    stats,
    environmentDistribution,
    serviceTypeDistribution,
    countryDistribution,
    hostingDistribution,
    recentInstances,
    recentActivity,
  };
}

module.exports = {
  getOverview,
};
