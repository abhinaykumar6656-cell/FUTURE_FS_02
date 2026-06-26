const { db, isFirebaseConfigured } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');
const { createId, readData, writeData } = require('../utils/localStore');

const LEADS_COLLECTION = 'leads';
const DEFAULT_STATUS = 'new';
const ALLOWED_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'converted', 'lost'];

const normalizeLeadStatus = (status) => (ALLOWED_STATUSES.includes(status) ? status : DEFAULT_STATUS);

const getLeads = async (req, res) => {
  try {
    const { status = '', search = '', sort = 'latest' } = req.query;
    if (!isFirebaseConfigured) {
      const searchTerm = search.toLowerCase();
      const leads = readData()
        .leads
        .filter((lead) => !status || normalizeLeadStatus(lead.status) === status)
        .filter((lead) => {
          if (!searchTerm) return true;
          return [lead.name, lead.email, lead.company, lead.phone, lead.source].some((value = '') =>
            String(value).toLowerCase().includes(searchTerm)
          );
        })
        .sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return sort === 'oldest' ? aTime - bTime : bTime - aTime;
        });
      return res.json({ leads });
    }

    let query = db.collection(LEADS_COLLECTION).orderBy('createdAt', 'desc');

    if (status) query = query.where('status', '==', status);
    if (search) {
      const searchTerm = search.toLowerCase();
      const snapshot = await db.collection(LEADS_COLLECTION).get();
      const leads = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((lead) =>
          [lead.name, lead.email, lead.company, lead.phone, lead.source].some((value = '') =>
            String(value).toLowerCase().includes(searchTerm)
          )
        );
      return res.json({ leads });
    }

    if (sort === 'oldest') query = db.collection(LEADS_COLLECTION).orderBy('createdAt', 'asc');

    const snapshot = await query.get();
    const leads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json({ leads });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch leads.', error: error.message });
  }
};

const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isFirebaseConfigured) {
      const data = readData();
      const lead = data.leads.find((item) => item.id === id);
      if (!lead) return res.status(404).json({ message: 'Lead not found.' });
      const notes = data.notes
        .filter((note) => note.leadId === id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ lead, notes });
    }

    const doc = await db.collection(LEADS_COLLECTION).doc(id).get();
    if (!doc.exists) return res.status(404).json({ message: 'Lead not found.' });
    const notesSnapshot = await db
      .collection(LEADS_COLLECTION)
      .doc(id)
      .collection('notes')
      .orderBy('createdAt', 'desc')
      .get();
    const notes = notesSnapshot.docs.map((noteDoc) => ({ id: noteDoc.id, ...noteDoc.data() }));
    return res.json({ lead: { id: doc.id, ...doc.data() }, notes });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch lead.', error: error.message });
  }
};

const createLead = async (req, res) => {
  try {
    const { name, email, phone, company, source, followUpDate, status } = req.body;
    if (!name || !email || !phone || !company || !source) {
      return res.status(400).json({ message: 'Required fields are missing.' });
    }

    if (!isFirebaseConfigured) {
      const data = readData();
      const now = new Date().toISOString();
      const lead = {
        id: createId(),
        name,
        email,
        phone,
        company,
        source,
        followUpDate: followUpDate || '',
        status: normalizeLeadStatus(status),
        createdAt: now,
        updatedAt: now,
      };
      data.leads.push(lead);
      writeData(data);
      return res.status(201).json({ lead });
    }

    const createdAt = Timestamp.now();
    const payload = {
      name,
      email,
      phone,
      company,
      source,
      followUpDate: followUpDate || '',
      status: normalizeLeadStatus(status),
      createdAt,
      updatedAt: createdAt,
    };
    const docRef = await db.collection(LEADS_COLLECTION).add(payload);
    const lead = await docRef.get();
    return res.status(201).json({ lead: { id: docRef.id, ...lead.data() } });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create lead.', error: error.message });
  }
};

const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, source, status, followUpDate } = req.body;
    if (!isFirebaseConfigured) {
      const data = readData();
      const lead = data.leads.find((item) => item.id === id);
      if (!lead) return res.status(404).json({ message: 'Lead not found.' });

      Object.entries({ name, email, phone, company, source, followUpDate }).forEach(([key, value]) => {
        if (value !== undefined) lead[key] = value;
      });
      if (status !== undefined) lead.status = normalizeLeadStatus(status);
      lead.updatedAt = new Date().toISOString();
      writeData(data);
      return res.json({ lead });
    }

    const docRef = db.collection(LEADS_COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Lead not found.' });

    const updatedAt = Timestamp.now();
    const payload = { updatedAt };
    if (name) payload.name = name;
    if (email) payload.email = email;
    if (phone) payload.phone = phone;
    if (company) payload.company = company;
    if (source) payload.source = source;
    if (status) payload.status = normalizeLeadStatus(status);
    if (followUpDate !== undefined) payload.followUpDate = followUpDate;

    await docRef.update(payload);
    const updatedDoc = await docRef.get();
    return res.json({ lead: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update lead.', error: error.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isFirebaseConfigured) {
      const data = readData();
      const leadExists = data.leads.some((item) => item.id === id);
      if (!leadExists) return res.status(404).json({ message: 'Lead not found.' });

      data.leads = data.leads.filter((item) => item.id !== id);
      data.notes = data.notes.filter((note) => note.leadId !== id);
      writeData(data);
      return res.json({ message: 'Lead deleted successfully.' });
    }

    const docRef = db.collection(LEADS_COLLECTION).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Lead not found.' });

    const notesSnapshot = await docRef.collection('notes').get();
    const batch = db.batch();
    notesSnapshot.docs.forEach((noteDoc) => batch.delete(noteDoc.ref));
    batch.delete(docRef);
    await batch.commit();

    return res.json({ message: 'Lead deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete lead.', error: error.message });
  }
};

const getNotes = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isFirebaseConfigured) {
      const notes = readData()
        .notes
        .filter((note) => note.leadId === id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ notes });
    }

    const snapshot = await db.collection(LEADS_COLLECTION).doc(id).collection('notes').orderBy('createdAt', 'desc').get();
    const notes = snapshot.docs.map((noteDoc) => ({ id: noteDoc.id, ...noteDoc.data() }));
    return res.json({ notes });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notes.', error: error.message });
  }
};

const addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, author } = req.body;
    if (!text) return res.status(400).json({ message: 'Note text is required.' });

    if (!isFirebaseConfigured) {
      const data = readData();
      const lead = data.leads.find((item) => item.id === id);
      if (!lead) return res.status(404).json({ message: 'Lead not found.' });

      const note = {
        id: createId(),
        leadId: id,
        text,
        author: author || req.user.email || 'admin',
        createdAt: new Date().toISOString(),
      };
      data.notes.push(note);
      writeData(data);
      return res.status(201).json({ note });
    }

    const docRef = db.collection(LEADS_COLLECTION).doc(id);
    const leadDoc = await docRef.get();
    if (!leadDoc.exists) return res.status(404).json({ message: 'Lead not found.' });

    const notePayload = {
      text,
      author: author || req.user.email || 'admin',
      createdAt: Timestamp.now(),
    };
    const noteRef = await docRef.collection('notes').add(notePayload);
    const note = await noteRef.get();
    return res.status(201).json({ note: { id: noteRef.id, ...note.data() } });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add note.', error: error.message });
  }
};

module.exports = { leadsController: { getLeads, getLeadById, createLead, updateLead, deleteLead, getNotes, addNote } };
