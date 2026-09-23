const Joi = require('joi');

const { ROLES } = require('../../shared/constants');

/**
 * Schémas de validation du module Users (utilisateurs).
 * Responsabilité : valider les payloads (body/query/params) entrants
 * du module avant qu'ils n'atteignent le contrôleur, via le middleware
 * middlewares/validate.js. `role` et `isActive` sont volontairement
 * absents de updateUserSchema : ce sont des actions ADMIN dédiées
 * (changeRoleSchema, activate/deactivate sans body), jamais une mise à
 * jour de profil générique.
 */

const ROLE_VALUES = Object.values(ROLES);

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createUserSchema = Joi.object({
  firstName: Joi.string().trim().max(100).required(),
  lastName: Joi.string().trim().max(100).required(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string().trim().max(30).allow('', null),
  login: Joi.string().trim().max(60).required(),
  role: Joi.string()
    .valid(...ROLE_VALUES)
    .default(ROLES.USER),
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().max(100),
  lastName: Joi.string().trim().max(100),
  email: Joi.string().trim().email(),
  phone: Joi.string().trim().max(30).allow('', null),
}).min(1);

const changeRoleSchema = Joi.object({
  role: Joi.string()
    .valid(...ROLE_VALUES)
    .required(),
});

const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(150).allow('', null),
  sortBy: Joi.string().valid('firstName', 'lastName', 'email', 'createdAt').default('createdAt'),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
});

module.exports = {
  idParamSchema,
  createUserSchema,
  updateUserSchema,
  changeRoleSchema,
  listUsersQuerySchema,
};
