const { admin, isFirebaseConfigured } = require('../config/firebase');

const LOCAL_TOKEN = 'local-dev-token';

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  if (!isFirebaseConfigured) {
    if (token !== LOCAL_TOKEN) return res.status(401).json({ message: 'Unauthorized' });
    req.user = { uid: 'local-admin', email: 'admin@crm.local' };
    return next();
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = { authenticate };
