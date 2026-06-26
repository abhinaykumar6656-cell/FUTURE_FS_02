require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { authController } = require('./controllers/authController');
const { contactController } = require('./controllers/contactController');
const { dashboardController } = require('./controllers/dashboardController');
const { leadsController } = require('./controllers/leadsController');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true }));
app.use(express.json());

app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);
app.post('/api/contact', contactController.createContactLead);

app.use('/api/leads', authenticate);
app.get('/api/leads', leadsController.getLeads);
app.post('/api/leads', leadsController.createLead);
app.get('/api/leads/:id/notes', leadsController.getNotes);
app.post('/api/leads/:id/notes', leadsController.addNote);
app.get('/api/leads/:id', leadsController.getLeadById);
app.put('/api/leads/:id', leadsController.updateLead);
app.delete('/api/leads/:id', leadsController.deleteLead);

app.use('/api/dashboard', authenticate);
app.get('/api/dashboard/stats', dashboardController.getStats);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CRM backend is running.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`CRM backend running on http://localhost:${PORT}`);
});
