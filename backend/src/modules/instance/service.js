const { Op } = require('sequelize');

const {
  Instance,
  Service,
  Client,
  Pod,
  StatutInstance,
  Environment,
  Hosting,
  Network,
  InstanceEnvironment,
  Composant,
  Inventaire,
  SupportLevel,
  InstanceSupportLevel,
  Platform,
} = require('../../database');
const ApiError = require('../../shared/utils/ApiError');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche service du module Instance.
 * Responsabilité : gérer le déploiement d'un Service chez un Client
 * (recherche, pagination, filtres par pays/service/type de
 * service/environnement/statut, génération automatique du code,
 * vérification du Service, du Client, du StatutInstance et des Hostings
 * associés, suppression douce). Les hébergements d'une instance sont portés par la
 * table pivot instance_hostings (many-to-many) — jamais par une liste
 * stockée sur Instance. Les environnements (module settings) restent
 * gérés en parallèle via instance_environments, inchangés par le
 * refactoring TypeClient/Client/Hosting. Les dépendances réseau
 * (référentiel settings.Network) suivent le même principe via
 * instance_networks. Les composants (table
 * `composants`, propres à chaque instance — pas un référentiel partagé),
 * chacun pouvant référencer une plateforme (settings.Platform, facultatif,
 * vérifiée via `assertPlatformExists`), et leurs inventaires (table
 * `inventaires`, propres à chaque composant) sont remplacés en bloc à
 * chaque create/update via `syncComposants`. Les
 * niveaux de support assignés (table `instance_support_levels` : référence
 * le référentiel settings.SupportLevel + un responsable propre à
 * l'assignation) sont remplacés en bloc de la même façon via
 * `syncSupportLevels`. Ne manipule jamais req/res (réservé au contrôleur).
 */

const CLIENT_INCLUDE = {
  model: Client,
  as: 'client',
};

const POD_INCLUDE = {
  model: Pod,
  as: 'pod',
};

const STATUT_INSTANCE_INCLUDE = {
  model: StatutInstance,
  as: 'statutInstance',
};

const ENVIRONMENTS_INCLUDE = {
  model: Environment,
  as: 'environments',
  through: { attributes: [] },
};

const HOSTINGS_INCLUDE = {
  model: Hosting,
  as: 'hostings',
  through: { attributes: [] },
};

const NETWORKS_INCLUDE = {
  model: Network,
  as: 'networks',
  through: { attributes: [] },
};

const COMPOSANTS_INCLUDE = {
  model: Composant,
  as: 'composants',
  include: [
    { model: Inventaire, as: 'inventaires' },
    { model: Platform, as: 'platform' },
  ],
};

const SUPPORT_LEVELS_INCLUDE = {
  model: InstanceSupportLevel,
  as: 'instanceSupportLevels',
  include: [{ model: SupportLevel, as: 'supportLevel' }],
};

const INSTANCE_INCLUDES = [
  CLIENT_INCLUDE,
  POD_INCLUDE,
  STATUT_INSTANCE_INCLUDE,
  ENVIRONMENTS_INCLUDE,
  HOSTINGS_INCLUDE,
  NETWORKS_INCLUDE,
  COMPOSANTS_INCLUDE,
  SUPPORT_LEVELS_INCLUDE,
];

function generateCode(id) {
  return `INST-${String(id).padStart(6, '0')}`;
}

/**
 * Remplace intégralement les composants d'une instance par `composants`
 * (tableau de `{ name, description, inventaires }`) : contrairement aux
 * environnements/hébergements, les composants ne sont pas un référentiel
 * partagé sélectionné par id — ce sont des lignes propres à l'instance,
 * saisies directement dans son formulaire. Pas de diff par id : on
 * supprime tout (cascade SQL vers les inventaires du composant) puis on
 * recrée, plus simple qu'un suivi fin des ajouts/suppressions pour une
 * liste éditée en bloc à chaque sauvegarde. `Composant.create` (plutôt
 * que `bulkCreate`) est utilisé un par un car il faut l'id auto-incrémenté
 * de chaque composant pour créer ses inventaires — MySQL ne renvoie pas
 * les id générés sur un `bulkCreate` multi-lignes.
 */
async function syncComposants(instanceId, composants) {
  await Composant.destroy({ where: { instanceId } });

  if (!composants || composants.length === 0) {
    return;
  }

  for (const { inventaires, ...composantFields } of composants) {
    await assertPlatformExists(composantFields.platformId);

    const composant = await Composant.create({ ...composantFields, instanceId });

    if (inventaires && inventaires.length > 0) {
      await Inventaire.bulkCreate(inventaires.map((inventaire) => ({ ...inventaire, composantId: composant.id })));
    }
  }
}

/**
 * Remplace intégralement les assignations de niveaux de support d'une
 * instance par `supportLevels` (tableau de `{ supportLevelId,
 * responsable, telephone }`) : comme pour les composants, pas de diff par id — on
 * supprime tout puis on recrée. `bulkCreate` suffit ici (contrairement à
 * syncComposants) car aucune entité enfant ne dépend de l'id généré.
 */
async function syncSupportLevels(instanceId, supportLevels) {
  await InstanceSupportLevel.destroy({ where: { instanceId } });

  if (supportLevels && supportLevels.length > 0) {
    await InstanceSupportLevel.bulkCreate(
      supportLevels.map((supportLevel) => ({ ...supportLevel, instanceId }))
    );
  }
}

async function assertSupportLevelsExist(supportLevels) {
  if (!supportLevels || supportLevels.length === 0) {
    return;
  }

  const supportLevelIds = supportLevels.map((supportLevel) => supportLevel.supportLevelId);
  const uniqueSupportLevelIds = new Set(supportLevelIds);

  if (uniqueSupportLevelIds.size !== supportLevelIds.length) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Un même niveau de support ne peut être assigné qu\'une fois');
  }

  const found = await SupportLevel.findAll({ where: { id: supportLevelIds } });

  if (found.length !== uniqueSupportLevelIds.size) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Un ou plusieurs niveaux de support sont introuvables');
  }
}

async function assertServiceExists(serviceId) {
  const service = await Service.findByPk(serviceId);

  if (!service) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service introuvable');
  }
}

async function assertClientExists(clientId) {
  const client = await Client.findByPk(clientId);

  if (!client) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Client introuvable');
  }
}

async function assertPlatformExists(platformId) {
  if (!platformId) {
    return;
  }

  const platform = await Platform.findByPk(platformId);

  if (!platform) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Plateforme introuvable');
  }
}

async function assertPodExists(podId) {
  const pod = await Pod.findByPk(podId);

  if (!pod) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Pod introuvable');
  }
}

async function assertStatutInstanceExists(statutInstanceId) {
  const statutInstance = await StatutInstance.findByPk(statutInstanceId);

  if (!statutInstance) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Statut introuvable');
  }
}

async function assertEnvironmentsExist(environmentIds) {
  if (!environmentIds || environmentIds.length === 0) {
    return;
  }

  const found = await Environment.findAll({ where: { id: environmentIds } });

  if (found.length !== environmentIds.length) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Un ou plusieurs environnements sont introuvables');
  }
}

async function assertHostingsExist(hostingIds) {
  if (!hostingIds || hostingIds.length === 0) {
    return;
  }

  const found = await Hosting.findAll({ where: { id: hostingIds } });

  if (found.length !== hostingIds.length) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Un ou plusieurs hébergements sont introuvables');
  }
}

async function assertNetworksExist(networkIds) {
  if (!networkIds || networkIds.length === 0) {
    return;
  }

  const found = await Network.findAll({ where: { id: networkIds } });

  if (found.length !== networkIds.length) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Un ou plusieurs réseaux sont introuvables');
  }
}

/**
 * Résout les filtres relationnels (pays, type de service, environnement)
 * en une liste d'ids d'Instance, puis intersecte les résultats — plutôt
 * que d'ajouter ces filtres comme `include`/`where` sur la requête
 * principale, ce qui tronquerait `environments`/`hostings` renvoyés (un
 * include filtré ne renvoie que la ligne jointe qui matche, pas la liste
 * complète des environnements/hébergements de l'instance). `null` signifie
 * "aucun filtre relationnel actif" (à ne pas confondre avec une liste
 * vide, qui elle signifie "aucune instance ne correspond").
 */
async function resolveRelationalInstanceIds({ countryId, serviceTypeId, environmentId }) {
  let ids = null;

  const intersect = (candidateIds) => {
    ids = ids === null ? candidateIds : ids.filter((id) => candidateIds.includes(id));
  };

  if (countryId) {
    const clients = await Client.findAll({ where: { countryId }, attributes: ['id'] });
    const clientIds = clients.map((client) => client.id);
    const instances = clientIds.length > 0 ? await Instance.findAll({ where: { clientId: clientIds }, attributes: ['id'] }) : [];
    intersect(instances.map((instance) => instance.id));
  }

  if (serviceTypeId) {
    const services = await Service.findAll({ where: { serviceTypeId }, attributes: ['id'] });
    const serviceIds = services.map((service) => service.id);
    const instances = serviceIds.length > 0 ? await Instance.findAll({ where: { serviceId: serviceIds }, attributes: ['id'] }) : [];
    intersect(instances.map((instance) => instance.id));
  }

  if (environmentId) {
    const links = await InstanceEnvironment.findAll({ where: { environmentId }, attributes: ['instanceId'] });
    intersect(links.map((link) => link.instanceId));
  }

  return ids;
}

async function list({ page, limit, search, countryId, serviceId, serviceTypeId, environmentId, statutInstanceId, podId }) {
  const where = search
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { comments: { [Op.like]: `%${search}%` } },
        ],
      }
    : {};

  if (serviceId) {
    where.serviceId = serviceId;
  }
  if (statutInstanceId) {
    where.statutInstanceId = statutInstanceId;
  }
  if (podId) {
    where.podId = podId;
  }

  const relationalIds = await resolveRelationalInstanceIds({ countryId, serviceTypeId, environmentId });

  if (relationalIds !== null) {
    if (relationalIds.length === 0) {
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }
    where.id = relationalIds;
  }

  const { rows, count } = await Instance.findAndCountAll({
    where,
    include: INSTANCE_INCLUDES,
    order: [['name', 'ASC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  return {
    items: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit) || 1,
  };
}

async function getById(id) {
  const instance = await Instance.findByPk(id, {
    include: INSTANCE_INCLUDES,
  });

  if (!instance) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Instance introuvable');
  }

  return instance;
}

async function create(data) {
  await assertServiceExists(data.serviceId);
  await assertClientExists(data.clientId);
  await assertPodExists(data.podId);
  await assertStatutInstanceExists(data.statutInstanceId);
  await assertEnvironmentsExist(data.environmentIds);
  await assertHostingsExist(data.hostingIds);
  await assertNetworksExist(data.networkIds);
  await assertSupportLevelsExist(data.supportLevels);

  // `code` est requis et unique en base : on insère une valeur provisoire
  // puis on la remplace par le code définitif dérivé de l'id généré,
  // seule source garantie unique sans logique de séquence dédiée.
  const instance = await Instance.create({
    name: data.name,
    serviceId: data.serviceId,
    clientId: data.clientId,
    podId: data.podId,
    statutInstanceId: data.statutInstanceId,
    comments: data.comments,
    produitOceane: data.produitOceane,
    code: `TMP-${Date.now()}`,
  });

  instance.code = generateCode(instance.id);
  await instance.save();

  if (data.environmentIds && data.environmentIds.length > 0) {
    await instance.setEnvironments(data.environmentIds);
  }

  if (data.hostingIds && data.hostingIds.length > 0) {
    await instance.setHostings(data.hostingIds);
  }

  if (data.networkIds && data.networkIds.length > 0) {
    await instance.setNetworks(data.networkIds);
  }

  if (data.composants) {
    await syncComposants(instance.id, data.composants);
  }

  if (data.supportLevels) {
    await syncSupportLevels(instance.id, data.supportLevels);
  }

  return getById(instance.id);
}

async function update(id, data) {
  const instance = await getById(id);
  const { environmentIds, hostingIds, networkIds, composants, supportLevels, ...fields } = data;

  if (fields.serviceId) {
    await assertServiceExists(fields.serviceId);
  }
  if (fields.clientId) {
    await assertClientExists(fields.clientId);
  }
  if (fields.podId) {
    await assertPodExists(fields.podId);
  }
  if (fields.statutInstanceId) {
    await assertStatutInstanceExists(fields.statutInstanceId);
  }
  if (environmentIds) {
    await assertEnvironmentsExist(environmentIds);
  }
  if (hostingIds) {
    await assertHostingsExist(hostingIds);
  }
  if (networkIds) {
    await assertNetworksExist(networkIds);
  }
  if (supportLevels) {
    await assertSupportLevelsExist(supportLevels);
  }

  if (Object.keys(fields).length > 0) {
    await instance.update(fields);
  }

  if (environmentIds) {
    await instance.setEnvironments(environmentIds);
  }

  if (hostingIds) {
    await instance.setHostings(hostingIds);
  }

  if (networkIds) {
    await instance.setNetworks(networkIds);
  }

  if (composants) {
    await syncComposants(instance.id, composants);
  }

  if (supportLevels) {
    await syncSupportLevels(instance.id, supportLevels);
  }

  return getById(id);
}

async function remove(id) {
  const instance = await getById(id);
  await instance.destroy(); // soft delete (paranoid: true côté modèle)
}

async function setArchitectureImage(id, architectureImageUrl) {
  const instance = await getById(id);
  await instance.update({ architectureImageUrl });
  return getById(id);
}

async function removeArchitectureImage(id) {
  return setArchitectureImage(id, null);
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  setArchitectureImage,
  removeArchitectureImage,
};
