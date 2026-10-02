const { AppSetting, PodEscalation, Pod } = require('../../database');
const ApiError = require('../../shared/utils/ApiError');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche service du module Escalation (matrice d'escalade GOS).
 * Responsabilité : lire et mettre à jour
 *  - l'escalade managériale (commune à toutes les instances) ;
 *  - la ligne « Normal Process » de l'escalade technique (commune) ;
 *  - la ligne « Technical escalation » de chaque POD ;
 * et composer la matrice complète d'une instance d'après son POD
 * (`getMatrixForPod`), utilisée par l'administration, le site public
 * (utilisateurs connectés) et l'API d'intégration.
 */

const MANAGERIAL_KEY = 'escalation.managerial';
const TECHNICAL_NORMAL_KEY = 'escalation.technical_normal';

// Étapes de l'escalade technique (texte fixe du processus GOS).
const TECHNICAL_PROCESS = [
  { step: 'Normal Process', target: 'Service Desk & Monitoring' },
  { step: 'Escalation 1', target: 'Quality Analyst' },
  { step: 'Escalation 2', target: 'Support Leader (Head of cluster)' },
];

const EMPTY_MANAGERIAL = { intro: '', availability: '', businessHours: '', eds: '', note: '', levels: [] };
const EMPTY_TECHNICAL_NORMAL = {
  intro: '',
  cluster: 'Service Desk & Monitoring',
  countries: '',
  qualityAnalyst: null,
  headOfCluster: null,
};

async function getSetting(key, fallback) {
  const setting = await AppSetting.findByPk(key);
  return setting ? setting.value : fallback;
}

async function setSetting(key, value) {
  const [setting] = await AppSetting.findOrCreate({ where: { key }, defaults: { key, value } });
  await setting.update({ value });
  return setting.value;
}

function toPodEscalationDto(pod, escalation) {
  return {
    pod: { id: pod.id, code: pod.code, name: pod.name },
    countries: escalation?.countries ?? '',
    qualityAnalyst: escalation?.qualityAnalyst ?? null,
    headOfCluster: escalation?.headOfCluster ?? null,
    configured: Boolean(escalation),
  };
}

async function getGlobal() {
  const [managerial, technicalNormal] = await Promise.all([
    getSetting(MANAGERIAL_KEY, EMPTY_MANAGERIAL),
    getSetting(TECHNICAL_NORMAL_KEY, EMPTY_TECHNICAL_NORMAL),
  ]);
  return { managerial, technicalNormal, technicalProcess: TECHNICAL_PROCESS };
}

async function updateManagerial(data) {
  return setSetting(MANAGERIAL_KEY, data);
}

async function updateTechnicalNormal(data) {
  return setSetting(TECHNICAL_NORMAL_KEY, data);
}

async function listPodEscalations() {
  const pods = await Pod.findAll({
    attributes: ['id', 'code', 'name'],
    include: [{ model: PodEscalation, as: 'escalation' }],
    order: [['name', 'ASC']],
  });
  return pods.map((pod) => toPodEscalationDto(pod, pod.escalation));
}

async function upsertPodEscalation(podId, { countries, qualityAnalyst, headOfCluster }) {
  const pod = await Pod.findByPk(podId, { attributes: ['id', 'code', 'name'] });
  if (!pod) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'POD introuvable');
  }

  const [escalation] = await PodEscalation.findOrCreate({ where: { podId }, defaults: { podId } });
  await escalation.update({
    countries: countries || null,
    qualityAnalyst: qualityAnalyst ?? null,
    headOfCluster: headOfCluster ?? null,
  });
  return toPodEscalationDto(pod, escalation);
}

/**
 * Matrice d'escalade complète d'une instance : escalade managériale
 * (commune) + escalade technique (ligne « Normal Process » commune + ligne
 * du POD de l'instance, `technical.podEscalation` à null si le POD n'a pas
 * encore de ligne configurée).
 */
async function getMatrixForPod(podId) {
  const [global, pod] = await Promise.all([
    getGlobal(),
    podId ? Pod.findByPk(podId, { attributes: ['id', 'code', 'name'] }) : null,
  ]);
  const escalation = pod ? await PodEscalation.findByPk(pod.id) : null;

  return {
    managerial: global.managerial,
    technical: {
      normalProcess: global.technicalNormal,
      podEscalation: pod && escalation ? toPodEscalationDto(pod, escalation) : null,
      pod: pod ? { id: pod.id, code: pod.code, name: pod.name } : null,
      process: TECHNICAL_PROCESS,
    },
  };
}

module.exports = {
  getGlobal,
  updateManagerial,
  updateTechnicalNormal,
  listPodEscalations,
  upsertPodEscalation,
  getMatrixForPod,
};
