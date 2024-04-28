// const crypto = require('crypto');

// Generate a new key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Export the keys
module.exports = {
  PUBLIC_KEY: publicKey,
  PRIVATE_KEY: privateKey
};