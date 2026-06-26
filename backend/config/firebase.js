const admin = require('firebase-admin');

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

const isFirebaseConfigured = Boolean(serviceAccount);

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

const db = isFirebaseConfigured ? admin.firestore() : null;
module.exports = { admin, db, isFirebaseConfigured };
