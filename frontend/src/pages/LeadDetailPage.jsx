import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Toast from '../components/Toast';
import { statusLabels, statusOptions } from '../constants/statuses';
import api from '../services/api';

const formatTimestamp = (value) => {
  if (!value) return 'Not available';
  if (value.toDate) return value.toDate().toLocaleString();
  if (typeof value === 'object' && '_seconds' in value) {
    return new Date(value._seconds * 1000).toLocaleString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
};

const LeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/leads/${id}`);
      setLead(response.data.lead);
      setNotes(response.data.notes || []);
      setForm({
        name: response.data.lead.name || '',
        email: response.data.lead.email || '',
        phone: response.data.lead.phone || '',
        company: response.data.lead.company || '',
        source: response.data.lead.source || '',
        status: response.data.lead.status || 'new',
        followUpDate: response.data.lead.followUpDate || '',
      });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Could not load this lead.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveLead = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await api.put(`/leads/${id}`, form);
      setLead(response.data.lead);
      setToast({ type: 'success', message: 'Lead updated.' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Could not save lead.' });
    } finally {
      setSaving(false);
    }
  };

  const addNote = async (event) => {
    event.preventDefault();
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await api.post(`/leads/${id}/notes`, { text: noteText.trim() });
      setNoteText('');
      setToast({ type: 'success', message: 'Note added.' });
      await fetchLead();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Could not add note.' });
    } finally {
      setSaving(false);
    }
  };

  const deleteLead = async () => {
    const confirmed = window.confirm(`Delete ${lead.name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/leads/${id}`);
      navigate('/leads');
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Could not delete lead.' });
    }
  };

  if (loading) return <div className="empty-state">Loading lead...</div>;

  if (!lead || !form) {
    return (
      <div className="page-card">
        <p>Lead not found.</p>
        <Link className="secondary button-link" to="/leads">Back to leads</Link>
      </div>
    );
  }

  return (
    <div className="lead-detail-page">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="dashboard-header">
        <div>
          <Link className="back-link" to="/leads">Back to leads</Link>
          <h1>{lead.name}</h1>
          <p>{lead.company} · {lead.email}</p>
        </div>
        <span className={`status-pill status-${lead.status}`}>{statusLabels[lead.status] || lead.status}</span>
      </div>

      <div className="lead-detail-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Lead Profile</h2>
          </div>
          <form className="detail-form" onSubmit={saveLead}>
            <label>Name<input name="name" value={form.name} onChange={updateField} required /></label>
            <label>Email<input name="email" type="email" value={form.email} onChange={updateField} required /></label>
            <label>Phone<input name="phone" value={form.phone} onChange={updateField} required /></label>
            <label>Company<input name="company" value={form.company} onChange={updateField} required /></label>
            <label>Source<input name="source" value={form.source} onChange={updateField} required /></label>
            <label>
              Status
              <select name="status" value={form.status} onChange={updateField}>
                {statusOptions.map((item) => (
                  <option key={item} value={item}>{statusLabels[item]}</option>
                ))}
              </select>
            </label>
            <label>Follow-up date<input name="followUpDate" type="date" value={form.followUpDate} onChange={updateField} /></label>
            <div className="detail-actions">
              <button className="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
              <button className="danger" type="button" onClick={deleteLead}>Delete</button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Follow-up Timeline</h2>
          </div>
          <div className="timeline">
            <div>
              <span>Created</span>
              <strong>{formatTimestamp(lead.createdAt)}</strong>
            </div>
            <div>
              <span>Last updated</span>
              <strong>{formatTimestamp(lead.updatedAt)}</strong>
            </div>
            <div>
              <span>Next follow-up</span>
              <strong>{lead.followUpDate || 'Not set'}</strong>
            </div>
          </div>

          <form className="note-form" onSubmit={addNote}>
            <label>
              Add note
              <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Call summary, next step, pricing context..." />
            </label>
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add note'}</button>
          </form>

          <div className="notes-list">
            {notes.length === 0 ? (
              <div className="empty-state">No notes yet.</div>
            ) : (
              notes.map((note) => (
                <article className="note-card" key={note.id}>
                  <p>{note.text}</p>
                  <span>{note.author} · {formatTimestamp(note.createdAt)}</span>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LeadDetailPage;
