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
  Pod,
  Network,
  SupportLevel,
  InstanceSupportLevel,
  Inventaire,
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
 * jamais de Client, de Composant/Inventaire (IP, nom de serveur) ni de
 * niveau de support (responsable, téléphone) : uniquement le nom de
 * l'instance, son statut, ses environnements/hébergements, son Pod (filtre
 * de la page détail) et le pays du client (filtre géographique) — un
 * résumé anonymisé, jamais la fiche complète exposée côté administration.
 *
 * `getServiceInstanceById` (fiche détaillée d'une instance) ajoute les
 * informations descriptives (code, commentaires, produit Océane, schéma
 * d'architecture, réseaux) mais jamais le client, les composants (et leur
 * inventaire IP/serveurs) ni les contacts de support : ces informations
 * sensibles ne sont renvoyées que par `getServiceInstanceSensitive`, route
 * réservée aux utilisateurs authentifiés.
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

// Résumé d'instance commun à la liste d'un service et à la liste globale
// (page "Instances" du site public, tous services confondus).
async function findInstanceSummaries(where) {
  const instances = await Instance.findAll({
    where,
    attributes: ['id', 'name'],
    include: [
      { model: Service, as: 'service', attributes: ['id', 'name'] },
      { model: StatutInstance, as: 'statutInstance', attributes: ['id', 'name'] },
      { model: Environment, as: 'environments', attributes: ['id', 'name'], through: { attributes: [] } },
      { model: Hosting, as: 'hostings', attributes: ['id', 'name'], through: { attributes: [] } },
      { model: Pod, as: 'pod', attributes: ['id', 'name'] },
      {
        // Composants chargés uniquement pour en extraire les plateformes
        // (filtre Plateforme) — jamais renvoyés tels quels ici.
        model: Composant,
        as: 'composants',
        attributes: ['id'],
        include: [{ model: Platform, as: 'platform', attributes: ['id', 'name'] }],
      },
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
    service: instance.service ? { id: instance.service.id, name: instance.service.name } : null,
    statutInstance: instance.statutInstance
      ? { id: instance.statutInstance.id, name: instance.statutInstance.name }
      : null,
    environments: instance.environments.map((environment) => ({ id: environment.id, name: environment.name })),
    hostings: instance.hostings.map((hosting) => ({ id: hosting.id, name: hosting.name })),
    pod: instance.pod ? { id: instance.pod.id, name: instance.pod.name } : null,
    platforms: dedupeById(instance.composants.map((composant) => composant.platform)).map((platform) => ({
      id: platform.id,
      name: platform.name,
    })),
    country: instance.client?.country ? { id: instance.client.country.id, name: instance.client.country.name } : null,
  }));
}

async function listServiceInstances(serviceId) {
  // Lève une 404 si le service n'existe pas, avant même de chercher ses
  // instances (évite de renvoyer silencieusement une liste vide).
  await getServiceById(serviceId);

  return findInstanceSummaries({ serviceId });
}

async function listInstances() {
  return findInstanceSummaries({});
}

function toReference(item) {
  return item ? { id: item.id, name: item.name } : null;
}

async function getServiceInstanceById(serviceId, instanceId) {
  const service = await getServiceById(serviceId);

  const instance = await Instance.findOne({
    where: { id: instanceId, serviceId },
    attributes: ['id', 'code', 'name', 'comments', 'produitOceane', 'architectureImageUrl', 'createdAt', 'updatedAt'],
    include: [
      { model: StatutInstance, as: 'statutInstance', attributes: ['id', 'name'] },
      { model: Pod, as: 'pod', attributes: ['id', 'name'] },
      {
        // Seul le pays du client est public — `countryId` est requis par
        // Sequelize pour la jointure, le client lui-même n'est jamais renvoyé.
        model: Client,
        as: 'client',
        attributes: ['countryId'],
        include: [{ model: Country, as: 'country', attributes: ['id', 'name'] }],
      },
      { model: Environment, as: 'environments', attributes: ['id', 'name'], through: { attributes: [] } },
      { model: Hosting, as: 'hostings', attributes: ['id', 'name'], through: { attributes: [] } },
      { model: Network, as: 'networks', attributes: ['id', 'name'], through: { attributes: [] } },
    ],
  });

  if (!instance) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Instance introuvable');
  }

  return {
    id: instance.id,
    code: instance.code,
    name: instance.name,
    comments: instance.comments,
    produitOceane: instance.produitOceane,
    architectureImageUrl: instance.architectureImageUrl,
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt,
    service: {
      id: service.id,
      name: service.name,
      logoUrl: service.logoUrl,
      serviceType: toReference(service.serviceType),
    },
    statutInstance: toReference(instance.statutInstance),
    pod: toReference(instance.pod),
    country: toReference(instance.client?.country),
    environments: instance.environments.map(toReference),
    hostings: instance.hostings.map(toReference),
    networks: instance.networks.map(toReference),
  };
}

/**
 * Informations sensibles d'une instance (client, composants avec leur
 * inventaire IP/serveurs, contacts de support) — réservées aux
 * utilisateurs authentifiés (route protégée par authGuard, cf. routes.js) :
 * le site public ne les affiche qu'après connexion.
 */
async function getServiceInstanceSensitive(serviceId, instanceId) {
  const instance = await Instance.findOne({
    where: { id: instanceId, serviceId },
    attributes: ['id'],
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name'] },
      {
        model: Composant,
        as: 'composants',
        attributes: ['id', 'name', 'description'],
        include: [
          { model: Platform, as: 'platform', attributes: ['id', 'name'] },
          { model: Inventaire, as: 'inventaires', attributes: ['id', 'ip', 'nomServeur'] },
        ],
      },
      {
        model: InstanceSupportLevel,
        as: 'instanceSupportLevels',
        attributes: ['id', 'responsable', 'telephone'],
        include: [{ model: SupportLevel, as: 'supportLevel', attributes: ['id', 'name'] }],
      },
    ],
    order: [
      [{ model: Composant, as: 'composants' }, 'name', 'ASC'],
      [{ model: Composant, as: 'composants' }, { model: Inventaire, as: 'inventaires' }, 'id', 'ASC'],
      [{ model: InstanceSupportLevel, as: 'instanceSupportLevels' }, { model: SupportLevel, as: 'supportLevel' }, 'name', 'ASC'],
    ],
  });

  if (!instance) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Instance introuvable');
  }

  return {
    client: toReference(instance.client),
    composants: instance.composants.map((composant) => ({
      id: composant.id,
      name: composant.name,
      description: composant.description,
      platform: toReference(composant.platform),
      inventaires: composant.inventaires.map((inventaire) => ({
        id: inventaire.id,
        ip: inventaire.ip,
        nomServeur: inventaire.nomServeur,
      })),
    })),
    supportLevels: instance.instanceSupportLevels.map((assignment) => ({
      id: assignment.id,
      supportLevel: toReference(assignment.supportLevel),
      responsable: assignment.responsable,
      telephone: assignment.telephone,
    })),
  };
}

module.exports = {
  listServices,
  getServiceById,
  listServiceInstances,
  listInstances,
  getServiceInstanceById,
  getServiceInstanceSensitive,
};
