const path = require('path');
const multer = require('multer');

const ApiError = require('../shared/utils/ApiError');
const { HTTP_STATUS } = require('../shared/constants');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

// Seul usage actuel : logo de Service (module catalog). Si un futur usage
// nécessite d'autres types de fichiers, ajouter une config dédiée plutôt
// que d'élargir ce filtre pensé pour des images.
const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(new ApiError(HTTP_STATUS.BAD_REQUEST, 'Format de fichier non supporté (image uniquement)'));
      return;
    }
    cb(null, true);
  },
});

module.exports = uploadImage;
