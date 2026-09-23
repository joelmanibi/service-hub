const {
  Service,
  ServiceType,
  Instance,
  StatutInstance,
  Environment,
  Hosting,
  Client,
  Country,
  Composant,
  Platform,
} = require('../../database');
const ApiError = require('../../shared/utils/ApiError');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche service du module Public.
 * Responsabilité : projection en lecture seule, sans authentification, du
 * catalogue de Services (module catalog) et des Instances qui s'y
 * rattachent (module instance), pour le site public
 * (service-hub-public) — champs volontairement limités à ce qui est
 * présentable publiquement. Pour les Instances (`listServiceInstances`),
 * jamais de Client, de Pod, de Composant/Inventaire (IP, nom de serveur)
 * ni de niveau de support (responsable, téléphone) : uniquement le nom de
 * l'instance, son statut, ses environnements/hébergements et le pays du
 * client (filtre géographique) — un résumé anonymisé, jamais la fiche
 * complète exposée côté administration.
 *
 * `listServices` fait exception, par décision explicite (les filtres
 * Client/Plateforme/Hébergement de la home page publique doivent
 * fonctionner comme côté admin) : chaque service porte désormais
 * `clients`/`platforms`/`hostings`, les listes dédupliquées des
 * Clients/Plateformes/Hébergements de ses Instances — jamais le détail
 * par instance (pas d'association instance -> client visible ici), mais
 * le nom du client est, lui, public dès qu'il a au moins une instance
 * sur ce service.
 */

function dedupeById(items) {
  const seen = new Map();
  for (const item of items) {
    if (item && !seen.has(item.id)) {
      seen.set(item.id, item);
    }
  }
  return Array.from(seen.values());
}

const SERVICE_INSTANCES_INCLUDE = {
  model: Instance,
  as: 'instances',
  attributes: ['id'],
  include: [
    { model: Client, as: 'client', attributes: ['id', 'name'] },
    { model: Hosting, as: 'hostings', attributes: ['id', 'name'], through: { attributes: [] } },
    {
      model: Composant,
      as: 'composants',
      attributes: ['id'],
      include: [{ model: Platform, as: 'platform', attributes: ['id', 'name'] }],
    },
  ],
};

function withRelationalFilters(service) {
  const instances = service.instances ?? [];
  const clients = dedupeById(instances.map((instance) => instance.client).filter(Boolean));
  const hostings = dedupeById(instances.flatMap((instance) => instance.hostings ?? []));
  const platforms = dedupeById(
    instances.flatMap((instance) => (instance.composants ?? []).map((composant) => composant.platform))
  );

  return {
    id: service.id,
    code: service.code,
    name: service.name,
    description: service.description,
    logoUrl: service.logoUrl,
    serviceType: service.serviceType ? { id: service.serviceType.id, name: service.serviceType.name } : null,
    clients: clients.map((client) => ({ id: client.id, name: client.name })),
    hostings: hostings.map((hosting) => ({ id: hosting.id, name: hosting.name })),
    platforms: platforms.map((platform) => ({ id: platform.id, name: platform.name })),
  };
}

async function listServices() {
  const services = await Service.findAll({
    attributes: ['id', 'code', 'name', 'description', 'logoUrl'],
    include: [{ model: ServiceType, as: 'serviceType', attributes: ['id', 'name'] }, SERVICE_INSTANCES_INCLUDE],
    order: [['name', 'ASC']],
  });

  return services.map(withRelationalFilters);
}

async function getServiceById(id) {
  const service = await Service.findByPk(id, {
    attributes: ['id', 'code', 'name', 'description', 'logoUrl'],
    include: [{ model: ServiceType, as: 'serviceType', attributes: ['id', 'name'] }],
  });

  if (!service) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service introuvable');
  }

  return service;
}

async function listServiceInstances(serviceId) {
  // Lève une 404 si le service n'existe pas, avant même de chercher ses
  // instances (évite de renvoyer silencieusement une liste vide).
  await getServiceById(serviceId);

  const instances = await Instance.findAll({
    where: { serviceId },
    attributes: ['id', 'name'],
    include: [
      { model: StatutInstance, as: 'statutInstance', attributes: ['id', 'name'] },
      { model: Environment, as: 'environments', attributes: ['id', 'name'], through: { attributes: [] } },
      { model: Hosting, as: 'hostings', attributes: ['id', 'name'], through: { attributes: [] } },
      {
        // `attributes: []` seul casse la jointure imbriquée vers Country
        // (Sequelize a besoin de la FK `countryId` pour construire le
        // JOIN) — `countryId` reste ici uniquement pour ça : le mapping
        // ci-dessous ne renvoie jamais `client` tel quel, seulement
        // `client.country`.
        model: Client,
        as: 'client',
        attributes: ['countryId'],
        include: [{ model: Country, as: 'country', attributes: ['id', 'name'] }],
      },
    ],
    order: [['name', 'ASC']],
  });

  // Reconstruit un objet propre : jamais de clé `client`, même vide —
  // seul le pays qu'il porte est extrait.
  return instances.map((instance) => ({
    id: instance.id,
    name: instance.name,
    statutInstance: instance.statutInstance
      ? { id: instance.statutInstance.id, name: instance.statutInstance.name }
      : null,
    environments: instance.environments.map((environment) => ({ id: environment.id, name: environment.name })),
    hostings: instance.hostings.map((hosting) => ({ id: hosting.id, name: hosting.name })),
    country: instance.client?.country ? { id: instance.client.country.id, name: instance.client.country.name } : null,
  }));
}

module.exports = {
  listServices,
  getServiceById,
  listServiceInstances,
};
