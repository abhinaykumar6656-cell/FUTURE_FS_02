const { admin, isFirebaseConfigured } = require('../config/firebase');

const LOCAL_TOKEN = 'local-dev-token';
const LOCAL_EMAIL = process.env.LOCAL_ADMIN_EMAIL || 'admin@crm.com';
const LOCAL_PASSWORD = process.env.LOCAL_ADMIN_PASSWORD || 'admin123';

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (!isFirebaseConfigured) {
    const legacyUsernameLogin = email === 'admin' && password === 'secret123';
    const localEmailLogin = email === LOCAL_EMAIL && password === LOCAL_PASSWORD;
    if (!localEmailLogin && !legacyUsernameLogin) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    return res.json({
      token: LOCAL_TOKEN,
      uid: 'local-admin',
      email: legacyUsernameLogin ? 'admin@crm.local' : LOCAL_EMAIL,
    });
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    if (!userRecord.emailVerified) {
      return res.status(401).json({ message: 'Email not verified.' });
    }

    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    return res.json({ token: customToken, uid: userRecord.uid, email: userRecord.email });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid credentials.', detail: error.message });
  }
};

const logout = async (req, res) => {
  return res.json({ message: 'Logged out.' });
};

module.exports = { authController: { login, logout } };
