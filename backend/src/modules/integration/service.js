const { Op } = require('sequelize');

const {
  Instance,
  Service,
  ServiceType,
  Client,
  TypeClient,
  Country,
  Pod,
  StatutInstance,
  Environment,
  Hosting,
  Network,
  Composant,
  Inventaire,
  Platform,
  SupportLevel,
  InstanceSupportLevel,
} = require('../../database');
const ApiError = require('../../shared/utils/ApiError');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche service du module Integration.
 * Responsabilité : exposer aux applications tierces (authentifiées par clé
 * d'API, cf. middlewares/apiKeyGuard.js) la fiche complète des Instances,
 * inventaire des composants (IP, nom de serveur) compris. Le JSON renvoyé
 * est construit explicitement par `toIntegrationInstance` : c'est le
 * contrat de l'API — il ne doit pas suivre implicitement les évolutions
 * des modèles Sequelize ou de l'API d'administration.
 */

const REF_ATTRIBUTES = ['id', 'code', 'name'];

const INSTANCE_INCLUDES = [
  {
    model: Service,
    as: 'service',
    attributes: ['id', 'code', 'name'],
    include: [{ model: ServiceType, as: 'serviceType', attributes: REF_ATTRIBUTES }],
  },
  {
    model: Client,
    as: 'client',
    attributes: REF_ATTRIBUTES,
    include: [
      { model: Country, as: 'country', attributes: REF_ATTRIBUTES },
      { model: TypeClient, as: 'typeClient', attributes: REF_ATTRIBUTES },
    ],
  },
  { model: Pod, as: 'pod', attributes: REF_ATTRIBUTES },
  { model: StatutInstance, as: 'statutInstance', attributes: REF_ATTRIBUTES },
  { model: Environment, as: 'environments', attributes: REF_ATTRIBUTES, through: { attributes: [] } },
  { model: Hosting, as: 'hostings', attributes: REF_ATTRIBUTES, through: { attributes: [] } },
  { model: Network, as: 'networks', attributes: REF_ATTRIBUTES, through: { attributes: [] } },
  {
    model: Composant,
    as: 'composants',
    attributes: ['id', 'name', 'description'],
    include: [
      { model: Platform, as: 'platform', attributes: ['id', 'name', 'hostingId'] },
      { model: Inventaire, as: 'inventaires', attributes: ['id', 'ip', 'nomServeur'] },
    ],
  },
  {
    model: InstanceSupportLevel,
    as: 'instanceSupportLevels',
    attributes: ['id', 'responsable', 'telephone'],
    include: [{ model: SupportLevel, as: 'supportLevel', attributes: REF_ATTRIBUTES }],
  },
];

// Tri déterministe des listes imbriquées, pour une réponse stable d'un
// appel à l'autre.
const NESTED_ORDER = [
  [{ model: Composant, as: 'composants' }, 'id', 'ASC'],
  [{ model: Composant, as: 'composants' }, { model: Inventaire, as: 'inventaires' }, 'id', 'ASC'],
  [{ model: InstanceSupportLevel, as: 'instanceSupportLevels' }, 'id', 'ASC'],
];

function toRef(item) {
  return item ? { id: item.id, code: item.code, name: item.name } : null;
}

function toIntegrationInstance(instance) {
  const { service, client } = instance;

  return {
    id: instance.id,
    code: instance.code,
    name: instance.name,
    comments: instance.comments,
    produitOceane: instance.produitOceane,
    architectureImageUrl: instance.architectureImageUrl,
    createdAt: instance.createdAt,
    updatedAt: instance.updatedAt,
    service: service
      ? { id: service.id, code: service.code, name: service.name, serviceType: toRef(service.serviceType) }
      : null,
    client: client
      ? {
          id: client.id,
          code: client.code,
          name: client.name,
          country: toRef(client.country),
          typeClient: toRef(client.typeClient),
        }
      : null,
    pod: toRef(instance.pod),
    statutInstance: toRef(instance.statutInstance),
    environments: instance.environments.map(toRef),
    hostings: instance.hostings.map(toRef),
    networks: instance.networks.map(toRef),
    composants: instance.composants.map((composant) => ({
      id: composant.id,
      name: composant.name,
      description: composant.description,
      platform: composant.platform
        ? { id: composant.platform.id, name: composant.platform.name, hostingId: composant.platform.hostingId }
        : null,
      inventaires: composant.inventaires.map((inventaire) => ({
        id: inventaire.id,
        ip: inventaire.ip,
        nomServeur: inventaire.nomServeur,
      })),
    })),
    supportLevels: instance.instanceSupportLevels.map((assignment) => ({
      id: assignment.id,
      supportLevel: toRef(assignment.supportLevel),
      responsable: assignment.responsable,
      telephone: assignment.telephone,
    })),
  };
}

async function listInstances({ page, limit, serviceId, clientId, podId, statutInstanceId, updatedSince }) {
  const where = {};

  if (serviceId) where.serviceId = serviceId;
  if (clientId) where.clientId = clientId;
  if (podId) where.podId = podId;
  if (statutInstanceId) where.statutInstanceId = statutInstanceId;
  if (updatedSince) where.updatedAt = { [Op.gte]: updatedSince };

  // Deux temps : la page d'ids d'abord (compte + LIMIT/OFFSET fiables sur
  // la seule table instances, tri par id pour une pagination stable sans
  // doublon ni trou), puis le chargement complet de ces ids — un LIMIT
  // appliqué directement à une requête chargeant plusieurs associations
  // hasMany imbriquées est coûteux et fragile avec Sequelize.
  const { rows, count } = await Instance.findAndCountAll({
    where,
    attributes: ['id'],
    order: [['id', 'ASC']],
    limit,
    offset: (page - 1) * limit,
  });

  const ids = rows.map((row) => row.id);
  const instances =
    ids.length > 0
      ? await Instance.findAll({
          where: { id: ids },
          include: INSTANCE_INCLUDES,
          order: [['id', 'ASC'], ...NESTED_ORDER],
        })
      : [];

  const totalPages = Math.ceil(count / limit) || 1;

  return {
    items: instances.map(toIntegrationInstance),
    pagination: {
      page,
      limit,
      total: count,
      totalPages,
      hasNextPage: page < totalPages,
    },
  };
}

async function getInstanceById(id) {
  const instance = await Instance.findByPk(id, { include: INSTANCE_INCLUDES, order: NESTED_ORDER });

  if (!instance) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Instance introuvable');
  }

  return toIntegrationInstance(instance);
}

// Une application externe désigne un POD par son code (ex. "WECA") ou son
// nom plutôt que par son id interne : les trois sont acceptés. Comparaison
// insensible à la casse (collation MySQL par défaut).
async function resolvePod(ref) {
  const value = ref.trim();
  const where = /^\d+$/.test(value)
    ? { [Op.or]: [{ id: Number(value) }, { code: value }, { name: value }] }
    : { [Op.or]: [{ code: value }, { name: value }] };

  const pods = await Pod.findAll({ where, attributes: ['id', 'code', 'name'], order: [['id', 'ASC']] });

  if (pods.length === 0) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, `POD introuvable : "${value}"`);
  }
  // Priorité au code exact, puis au nom, puis à l'id.
  const lower = value.toLowerCase();
  return (
    pods.find((pod) => pod.code.toLowerCase() === lower) ??
    pods.find((pod) => pod.name.toLowerCase() === lower) ??
    pods[0]
  );
}

async function listPodInstances(podRef, query) {
  const pod = await resolvePod(podRef);
  const result = await listInstances({ ...query, podId: pod.id });

  return { pod: toRef(pod), ...result };
}

module.exports = {
  listInstances,
  getInstanceById,
  listPodInstances,
};
