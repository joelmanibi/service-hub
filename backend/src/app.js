const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const { apiPrefix } = require('./config/env');
const corsOptions = require('./config/cors');
const logger = require('./config/logger');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

/**
 * Configuration de l'application Express.
 * Responsabilité : assembler les middlewares transverses (sécurité,
 * CORS, logs HTTP, parsing du corps de requête) et monter le routeur
 * central. Ne contient aucune route ni logique métier.
 */

const app = express();

const morganStream = {
  write: (message) => logger.http(message.trim()),
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('combined', { stream: morganStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sert les fichiers téléversés (ex: logo de Service — module catalog).
// `Cross-Origin-Resource-Policy: cross-origin` est nécessaire car ces
// fichiers sont chargés par le frontend Next.js, sur une origine
// différente (helmet impose `same-origin` par défaut).
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin'),
  })
);

app.use(apiPrefix, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
