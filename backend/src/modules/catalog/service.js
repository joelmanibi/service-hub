const { Op } = require('sequelize');

const { Service, ServiceType, CloudServiceModel, Instance, InstanceHosting, Composant } = require('../../database');
const ApiError = require('../../shared/utils/ApiError');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche service du module Catalog.
 * Responsabilité : gérer uniquement les Services (recherche, pagination,
 * génération automatique du code, vérification du type de service et des
 * modèles de service cloud). Ne gère ni Instance, ni pays, ni
 * environnement, ni hébergement — ces aspects appartiennent désormais
 * aux Instances. Les filtres client/plateforme/hébergement de `list`
 * n'en restent pas moins résolus ici : un Service n'a pas lui-même de
 * Client/Platform/Hosting, mais "a" un Client/une Plateforme/un
 * Hébergement dès qu'au moins une de ses Instances y est rattachée (cf.
 * `resolveRelationalServiceIds`, même principe que
 * `resolveRelationalInstanceIds` côté module instance). Ne manipule
 * jamais req/res (réservé au contrôleur).
 */

const CLOUD_SERVICE_MODELS_INCLUDE = {
  model: CloudServiceModel,
  as: 'cloudServiceModels',
  attributes: ['id', 'name', 'code'],
  through: { attributes: [] },
};

function generateCode(id) {
  return `SRV-${String(id).padStart(6, '0')}`;
}

async function assertServiceTypeExists(serviceTypeId) {
  const serviceType = await ServiceType.findByPk(serviceTypeId);

  if (!serviceType) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Type de service introuvable');
  }
}

async function assertCloudServiceModelsExist(cloudServiceModelIds) {
  if (!cloudServiceModelIds || cloudServiceModelIds.length === 0) {
    return;
  }

  const found = await CloudServiceModel.findAll({ where: { id: cloudServiceModelIds } });

  if (found.length !== cloudServiceModelIds.length) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Un ou plusieurs modèles de service cloud sont introuvables');
  }
}

/**
 * Résout les filtres relationnels (client, plateforme, hébergement) en
 * une liste d'ids de Service, puis intersecte les résultats — un Service
 * matche dès qu'au moins une de ses Instances satisfait le filtre.
 * `null` signifie "aucun filtre relationnel actif" (à ne pas confondre
 * avec une liste vide, qui elle signifie "aucun service ne correspond").
 * Même principe que `resolveRelationalInstanceIds`
 * (modules/instance/service.js), résolu ici vers `serviceId` plutôt que
 * vers l'id de l'Instance elle-même.
 */
async function resolveRelationalServiceIds({ clientId, hostingId, platformId }) {
  let ids = null;

  const intersect = (candidateIds) => {
    ids = ids === null ? candidateIds : ids.filter((id) => candidateIds.includes(id));
  };

  if (clientId) {
    const instances = await Instance.findAll({ where: { clientId }, attributes: ['serviceId'] });
    intersect(instances.map((instance) => instance.serviceId));
  }

  if (hostingId) {
    const links = await InstanceHosting.findAll({ where: { hostingId }, attributes: ['instanceId'] });
    const instanceIds = links.map((link) => link.instanceId);
    const instances = instanceIds.length > 0 ? await Instance.findAll({ where: { id: instanceIds }, attributes: ['serviceId'] }) : [];
    intersect(instances.map((instance) => instance.serviceId));
  }

  if (platformId) {
    const composants = await Composant.findAll({ where: { platformId }, attributes: ['instanceId'] });
    const instanceIds = composants.map((composant) => composant.instanceId);
    const instances = instanceIds.length > 0 ? await Instance.findAll({ where: { id: instanceIds }, attributes: ['serviceId'] }) : [];
    intersect(instances.map((instance) => instance.serviceId));
  }

  return ids;
}

async function list({ page, limit, search, clientId, hostingId, platformId }) {
  const where = search
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ],
      }
    : {};

  const relationalIds = await resolveRelationalServiceIds({ clientId, hostingId, platformId });

  if (relationalIds !== null) {
    if (relationalIds.length === 0) {
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }
    where.id = relationalIds;
  }

  const { rows, count } = await Service.findAndCountAll({
    where,
    include: [CLOUD_SERVICE_MODELS_INCLUDE],
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
  const service = await Service.findByPk(id, { include: [CLOUD_SERVICE_MODELS_INCLUDE] });

  if (!service) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Service introuvable');
  }

  return service;
}

async function create(data) {
  await assertServiceTypeExists(data.serviceTypeId);
  await assertCloudServiceModelsExist(data.cloudServiceModelIds);

  // `code` est requis et unique en base : on insère une valeur provisoire
  // puis on la remplace par le code définitif dérivé de l'id généré,
  // seule source garantie unique sans logique de séquence dédiée.
  const service = await Service.create({
    name: data.name,
    serviceTypeId: data.serviceTypeId,
    description: data.description,
    logoUrl: data.logoUrl,
    code: `TMP-${Date.now()}`,
  });

  service.code = generateCode(service.id);
  await service.save();

  if (data.cloudServiceModelIds && data.cloudServiceModelIds.length > 0) {
    await service.setCloudServiceModels(data.cloudServiceModelIds);
  }

  return getById(service.id);
}

async function update(id, data) {
  const service = await getById(id);
  const { cloudServiceModelIds, ...fields } = data;

  if (fields.serviceTypeId) {
    await assertServiceTypeExists(fields.serviceTypeId);
  }
  if (cloudServiceModelIds) {
    await assertCloudServiceModelsExist(cloudServiceModelIds);
  }

  if (Object.keys(fields).length > 0) {
    await service.update(fields);
  }

  if (cloudServiceModelIds) {
    await service.setCloudServiceModels(cloudServiceModelIds);
  }

  return getById(id);
}

async function remove(id) {
  const service = await getById(id);
  // Suppression douce (paranoid: true) : ne déclenche jamais de vraie
  // requête DELETE, donc jamais la contrainte RESTRICT portée par
  // `instances.service_id` — un service reste supprimable même s'il est
  // encore référencé par des instances.
  await service.destroy();
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
