const { Router } = require('express');

const controller = require('./controller');
const {
  idParamSchema,
  createApiKeySchema,
  createApiKeyRequestSchema,
  listApiKeyRequestsQuerySchema,
  approveApiKeyRequestSchema,
  rejectApiKeyRequestSchema,
} = require('./validator');
const validate = require('../../middlewares/validate');
const authGuard = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../shared/constants');

/**
 * Routes HTTP du module ApiKey (toutes authentifiées par JWT utilisateur).
 *  - /api-keys           gestion des clés : ADMIN, sauf `/mine` (clés de
 *                        l'utilisateur connecté) et `/:id/reveal` (ADMIN ou
 *                        propriétaire de la clé — contrôle dans le service).
 *  - /api-key-requests   demandes de clé : création, consultation et
 *                        annulation par tout utilisateur connecté (ses
 *                        propres demandes) ; liste complète, approbation et
 *                        refus réservés aux ADMIN.
 */

const ADMIN = authorize([ROLES.ADMIN]);

const apiKeysRouter = Router();
apiKeysRouter.use(authGuard);

apiKeysRouter.get('/mine', controller.listMine);
apiKeysRouter.get('/:id/reveal', validate(idParamSchema, 'params'), controller.reveal);
apiKeysRouter.get('/', ADMIN, controller.list);
apiKeysRouter.post('/', ADMIN, validate(createApiKeySchema), controller.create);
apiKeysRouter.post('/:id/revoke', ADMIN, validate(idParamSchema, 'params'), controller.revoke);
apiKeysRouter.delete('/:id', ADMIN, validate(idParamSchema, 'params'), controller.remove);

const requestsRouter = Router();
requestsRouter.use(authGuard);

requestsRouter.post('/', validate(createApiKeyRequestSchema), controller.createRequest);
requestsRouter.get('/mine', controller.listMyRequests);
requestsRouter.post('/:id/cancel', validate(idParamSchema, 'params'), controller.cancelRequest);
requestsRouter.get('/', ADMIN, validate(listApiKeyRequestsQuerySchema, 'query'), controller.listRequests);
requestsRouter.post(
  '/:id/approve',
  ADMIN,
  validate(idParamSchema, 'params'),
  validate(approveApiKeyRequestSchema),
  controller.approveRequest
);
requestsRouter.post(
  '/:id/reject',
  ADMIN,
  validate(idParamSchema, 'params'),
  validate(rejectApiKeyRequestSchema),
  controller.rejectRequest
);

module.exports = {
  apiKeysRouter,
  requestsRouter,
};
