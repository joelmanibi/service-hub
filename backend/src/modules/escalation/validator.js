const Joi = require('joi');

/**
 * Schémas de validation du module Escalation.
 */

const phoneSchema = Joi.object({
  // Type de ligne : F (fixe), M (mobile)… — texte libre court.
  label: Joi.string().trim().max(20).allow(''),
  number: Joi.string().trim().max(40).required(),
});

const contactSchema = Joi.object({
  name: Joi.string().trim().max(150).allow(''),
  email: Joi.string().trim().email().max(150).allow(''),
  phones: Joi.array().items(phoneSchema).max(5).default([]),
}).allow(null);

const managerialSchema = Joi.object({
  intro: Joi.string().trim().max(300).allow(''),
  availability: Joi.string().trim().max(100).allow(''),
  businessHours: Joi.string().trim().max(150).allow(''),
  eds: Joi.string().trim().max(50).allow(''),
  note: Joi.string().trim().max(300).allow(''),
  levels: Joi.array()
    .items(
      Joi.object({
        level: Joi.string().trim().max(60).required(),
        contact: Joi.string().trim().max(150).allow(''),
        phones: Joi.array().items(phoneSchema).max(5).default([]),
        email: Joi.string().trim().email().max(150).allow(''),
      })
    )
    .max(10)
    .required(),
});

const technicalNormalSchema = Joi.object({
  intro: Joi.string().trim().max(300).allow(''),
  cluster: Joi.string().trim().max(100).allow(''),
  countries: Joi.string().trim().max(500).allow(''),
  qualityAnalyst: contactSchema,
  headOfCluster: contactSchema,
});

const podEscalationSchema = Joi.object({
  countries: Joi.string().trim().max(1000).allow('', null),
  qualityAnalyst: contactSchema,
  headOfCluster: contactSchema,
});

const podIdParamSchema = Joi.object({
  podId: Joi.number().integer().positive().required(),
});

module.exports = {
  managerialSchema,
  technicalNormalSchema,
  podEscalationSchema,
  podIdParamSchema,
};
