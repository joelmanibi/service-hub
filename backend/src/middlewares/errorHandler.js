const logger = require('../config/logger');

// multer (upload de fichiers) lève une MulterError (ex: LIMIT_FILE_SIZE)
// sans `statusCode` — sans ce mapping elle tomberait dans le 500 générique
// ci-dessous, masquant une erreur pourtant imputable à la requête (400).
const MULTER_ERROR_MESSAGES = {
  LIMIT_FILE_SIZE: 'Fichier trop volumineux (5 Mo maximum)',
};

const errorHandler = (err, req, res, next) => {
  const isMulterError = err.name === 'MulterError';
  const statusCode = err.statusCode || (isMulterError ? 400 : 500);
  const message = isMulterError ? MULTER_ERROR_MESSAGES[err.code] || err.message : err.message;

  logger.error(err.message, { stack: err.stack, path: req.originalUrl, method: req.method });

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
