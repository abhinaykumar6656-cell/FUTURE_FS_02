const { db, isFirebaseConfigured } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');
const { createId, readData, writeData } = require('../utils/localStore');

const LEADS_COLLECTION = 'leads';

const createContactLead = async (req, res) => {
  try {
    const { name, email, phone = '', company = '', source = 'Website contact form', message = '' } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    if (!isFirebaseConfigured) {
      const data = readData();
      const now = new Date().toISOString();
      const lead = {
        id: createId(),
        name,
        email,
        phone,
        company: company || 'Website visitor',
        source,
        status: 'new',
        followUpDate: '',
        createdAt: now,
        updatedAt: now,
      };

      data.leads.push(lead);
      data.notes.push({
        id: createId(),
        leadId: lead.id,
        text: message,
        author: 'Website form',
        createdAt: now,
      });
      writeData(data);
      return res.status(201).json({ lead });
    }

    const createdAt = Timestamp.now();
    const docRef = await db.collection(LEADS_COLLECTION).add({
      name,
      email,
      phone,
      company: company || 'Website visitor',
      source,
      status: 'new',
      followUpDate: '',
      createdAt,
      updatedAt: createdAt,
    });

    await docRef.collection('notes').add({
      text: message,
      author: 'Website form',
      createdAt,
    });

    const lead = await docRef.get();
    return res.status(201).json({ lead: { id: docRef.id, ...lead.data() } });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit contact request.', error: error.message });
  }
};

module.exports = { contactController: { createContactLead } };
