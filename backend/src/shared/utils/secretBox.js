const crypto = require('crypto');

const { jwt, apiKeyEncryptionSecret } = require('../../config/env');

/**
 * Chiffrement symétrique (AES-256-GCM) de petites valeurs secrètes à
 * conserver de façon récupérable — aujourd'hui les clés d'API, affichables
 * par un ADMIN ou par leur propriétaire. Clé dérivée de
 * API_KEY_ENCRYPTION_SECRET (recommandé), à défaut de JWT_SECRET : changer
 * ce secret rend les valeurs déjà chiffrées illisibles (les clés restent
 * valides pour l'authentification, seul leur ré-affichage est perdu).
 * Format stocké : base64(iv[12] | tag[16] | texte chiffré).
 */

function getKey() {
  const secret = apiKeyEncryptionSecret || (jwt.secret ? `${jwt.secret}:api-keys` : null);
  if (!secret) {
    throw new Error('Aucun secret de chiffrement configuré (API_KEY_ENCRYPTION_SECRET ou JWT_SECRET)');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}

function decrypt(payload) {
  const buffer = Buffer.from(payload, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), buffer.subarray(0, 12));
  decipher.setAuthTag(buffer.subarray(12, 28));
  return Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString('utf8');
}

module.exports = {
  encrypt,
  decrypt,
};
