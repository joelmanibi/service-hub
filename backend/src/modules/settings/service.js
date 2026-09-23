const { Op } = require('sequelize');

const db = require('../../database');
const ApiError = require('../../shared/utils/ApiError');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche service du module Settings (données de référence).
 * Responsabilité : fournir un CRUD générique (recherche, pagination,
 * unicité, soft delete) réutilisable par les référentiels — aucune
 * règle métier spécifique à l'un d'entre eux. `client` et `hosting` sont
 * des exceptions : `client` porte des clés étrangères (typeClientId
 * obligatoire, countryId facultatif) que le CRUD générique ne valide pas ;
 * `hosting` porte des `platforms` (table `platforms`, propres à
 * l'hébergement — pas un référentiel partagé) remplacées en bloc à chaque
 * create/update, même principe que `syncComposants` (module instance) —
 * toutes deux ont donc leur propre implémentation. Ne manipule jamais
 * req/res (réservé au contrôleur).
 */

function createReferenceService(Model, entityLabel) {
  async function list({ page, limit, search }) {
    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { code: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { rows, count } = await Model.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit,
      offset: (page - 1) * limit,
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
    const item = await Model.findByPk(id);

    if (!item) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, `${entityLabel} introuvable`);
    }

    return item;
  }

  async function assertUnique(field, value, excludeId = null) {
    const where = excludeId ? { [field]: value, id: { [Op.ne]: excludeId } } : { [field]: value };
    const existing = await Model.findOne({ where });

    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, `${entityLabel} : ${field} déjà utilisé`);
    }
  }

  async function create(data) {
    await assertUnique('code', data.code);
    await assertUnique('name', data.name);
    return Model.create(data);
  }

  async function update(id, data) {
    const item = await getById(id);

    if (data.code && data.code !== item.code) {
      await assertUnique('code', data.code, id);
    }
    if (data.name && data.name !== item.name) {
      await assertUnique('name', data.name, id);
    }

    return item.update(data);
  }

  async function remove(id) {
    const item = await getById(id);
    await item.destroy(); // soft delete (paranoid: true côté modèle)
  }

  return { list, getById, create, update, remove, assertUnique };
}

/**
 * Client : réutilise list/getById/remove/assertUnique du CRUD générique,
 * mais surcharge create/update pour valider typeClientId (obligatoire,
 * doit exister) et countryId (facultatif, doit exister si fourni) — un
 * Client appartient toujours à un seul TypeClient.
 */
function createClientService() {
  const generic = createReferenceService(db.Client, 'Client');

  async function assertTypeClientExists(typeClientId) {
    const typeClient = await db.TypeClient.findByPk(typeClientId);

    if (!typeClient) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Type de client introuvable');
    }
  }

  async function assertCountryExists(countryId) {
    if (countryId === undefined || countryId === null) {
      return;
    }

    const country = await db.Country.findByPk(countryId);

    if (!country) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Pays introuvable');
    }
  }

  async function create(data) {
    await assertTypeClientExists(data.typeClientId);
    await assertCountryExists(data.countryId);
    await generic.assertUnique('code', data.code);
    await generic.assertUnique('name', data.name);

    return db.Client.create(data);
  }

  async function update(id, data) {
    const client = await generic.getById(id);

    if (data.typeClientId) {
      await assertTypeClientExists(data.typeClientId);
    }
    if (data.countryId !== undefined) {
      await assertCountryExists(data.countryId);
    }
    if (data.code && data.code !== client.code) {
      await generic.assertUnique('code', data.code, id);
    }
    if (data.name && data.name !== client.name) {
      await generic.assertUnique('name', data.name, id);
    }

    return client.update(data);
  }

  return {
    list: generic.list,
    getById: generic.getById,
    create,
    update,
    remove: generic.remove,
  };
}

/**
 * Hosting : réutilise list (forme paginée)/getById/remove/assertUnique du
 * CRUD générique pour la recherche/suppression, mais surcharge
 * list/getById pour inclure les `platforms` de l'hébergement, et
 * create/update pour les synchroniser via `syncPlatforms`.
 *
 * Contrairement à `syncComposants` (module instance), `syncPlatforms` fait
 * un diff par id plutôt qu'un remplacement en bloc (delete + recreate) :
 * un `Composant` peut référencer une `Platform` (`platformId`, module
 * instance) — recréer systématiquement les plateformes leur donnerait de
 * nouveaux id à chaque sauvegarde de l'Hosting, même sans changement
 * réel, et casserait silencieusement ces références. Un élément de
 * `platforms` avec un `id` existant est mis à jour en place ; sans `id`,
 * une nouvelle Platform est créée ; toute Platform de l'hébergement
 * absente de la liste envoyée est supprimée (SET NULL en cascade sur les
 * composants qui la référençaient, cf. migration
 * 20260831093000-add-platform-id-to-composants).
 */
function createHostingService() {
  const generic = createReferenceService(db.Hosting, 'Hébergement');

  const PLATFORMS_INCLUDE = {
    model: db.Platform,
    as: 'platforms',
  };

  async function syncPlatforms(hostingId, platforms) {
    const existing = await db.Platform.findAll({ where: { hostingId }, attributes: ['id'] });
    const existingIds = existing.map((platform) => platform.id);
    const incomingIds = (platforms ?? [])
      .map((platform) => platform.id)
      .filter((id) => id !== undefined && id !== null);

    const idsToDelete = existingIds.filter((id) => !incomingIds.includes(id));
    if (idsToDelete.length > 0) {
      await db.Platform.destroy({ where: { id: idsToDelete } });
    }

    for (const { id, ...fields } of platforms ?? []) {
      if (id && existingIds.includes(id)) {
        await db.Platform.update(fields, { where: { id } });
      } else {
        await db.Platform.create({ ...fields, hostingId });
      }
    }
  }

  async function list({ page, limit, search }) {
    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { code: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { rows, count } = await db.Hosting.findAndCountAll({
      where,
      include: [PLATFORMS_INCLUDE],
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
    const item = await db.Hosting.findByPk(id, { include: [PLATFORMS_INCLUDE] });

    if (!item) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Hébergement introuvable');
    }

    return item;
  }

  async function create(data) {
    const { platforms, ...fields } = data;

    await generic.assertUnique('code', fields.code);
    await generic.assertUnique('name', fields.name);

    const hosting = await db.Hosting.create(fields);

    if (platforms) {
      await syncPlatforms(hosting.id, platforms);
    }

    return getById(hosting.id);
  }

  async function update(id, data) {
    const hosting = await generic.getById(id);
    const { platforms, ...fields } = data;

    if (fields.code && fields.code !== hosting.code) {
      await generic.assertUnique('code', fields.code, id);
    }
    if (fields.name && fields.name !== hosting.name) {
      await generic.assertUnique('name', fields.name, id);
    }

    if (Object.keys(fields).length > 0) {
      await hosting.update(fields);
    }

    if (platforms) {
      await syncPlatforms(id, platforms);
    }

    return getById(id);
  }

  return {
    list,
    getById,
    create,
    update,
    remove: generic.remove,
  };
}

module.exports = {
  country: createReferenceService(db.Country, 'Pays'),
  typeClient: createReferenceService(db.TypeClient, 'Type de client'),
  client: createClientService(),
  status: createReferenceService(db.Status, 'Statut'),
  criticality: createReferenceService(db.Criticality, 'Criticité'),
  technology: createReferenceService(db.Technology, 'Technologie'),
  hosting: createHostingService(),
  environment: createReferenceService(db.Environment, 'Environnement'),
  serviceType: createReferenceService(db.ServiceType, 'Type de service'),
  statutInstance: createReferenceService(db.StatutInstance, 'Statut'),
  pod: createReferenceService(db.Pod, 'Pod'),
  supportLevel: createReferenceService(db.SupportLevel, 'Niveau de support'),
  cloudServiceModel: createReferenceService(db.CloudServiceModel, 'Modèle de service cloud'),
  network: createReferenceService(db.Network, 'Réseau'),
};
