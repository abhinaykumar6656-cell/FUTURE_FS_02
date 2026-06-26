import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { statusLabels, statusOptions } from '../constants/statuses';
import api from '../services/api';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  source: '',
  followUpDate: '',
  status: 'new',
};

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [editingStatus, setEditingStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedSettings = localStorage.getItem('crmSettings');
    if (!storedSettings) return;

    try {
      const settings = JSON.parse(storedSettings);
      if (statusOptions.includes(settings.defaultStatus)) {
        setForm((current) => ({ ...current, status: settings.defaultStatus }));
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      const response = await api.get(`/leads?${params.toString()}`);
      setLeads(response.data.leads);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Could not load leads.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, status]);

  const leadCounts = useMemo(() => {
    return leads.reduce(
      (counts, lead) => ({ ...counts, [lead.status]: (counts[lead.status] || 0) + 1 }),
      { new: 0, contacted: 0, converted: 0 }
    );
  }, [leads]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddLead = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/leads', form);
      setForm(emptyForm);
      setToast({ type: 'success', message: 'Lead added.' });
      await fetchLeads();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Could not add lead.' });
    } finally {
      setSaving(false);
    }
  };

  const startStatusEdit = (lead) => {
    setEditingLeadId(lead.id);
    setEditingStatus(lead.status);
  };

  const cancelStatusEdit = () => {
    setEditingLeadId(null);
    setEditingStatus('');
  };

  const saveStatusEdit = async (leadId) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/leads/${leadId}`, { status: editingStatus });
      await fetchLeads();
      cancelStatusEdit();
      setToast({ type: 'success', message: 'Lead status updated.' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Could not update status.' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteLead = async (lead) => {
    const confirmed = window.confirm(`Delete ${lead.name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/leads/${lead.id}`);
      setToast({ type: 'success', message: 'Lead deleted.' });
      await fetchLeads();
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Could not delete lead.' });
    }
  };

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Follow-up date'];
    const rows = leads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone,
      lead.company,
      lead.source,
      lead.status,
      lead.followUpDate || '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value = '') => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'crm-leads.csv';
    link.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', message: 'CSV exported.' });
  };

  return (
    <div className="leads-page">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="panel add-lead-panel">
        <div className="panel-header">
          <h2>Add Lead</h2>
        </div>
        <form className="lead-form" onSubmit={handleAddLead}>
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
          <input name="company" placeholder="Company" value={form.company} onChange={handleChange} required />
          <input name="source" placeholder="Source" value={form.source} onChange={handleChange} required />
          <input name="followUpDate" type="date" value={form.followUpDate} onChange={handleChange} />
          <select name="status" value={form.status} onChange={handleChange}>
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
          <button className="primary" type="submit" disabled={saving}>
            {saving ? 'Adding...' : 'Add lead'}
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Leads</h2>
          <div className="filters">
            <input
              placeholder="Search name, email, phone, company, source"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="secondary compact-button" type="button" onClick={exportCsv} disabled={leads.length === 0}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="status-tabs">
          <button className={!status ? 'active' : ''} type="button" onClick={() => setStatus('')}>
            All <span>{leads.length}</span>
          </button>
          {statusOptions.map((item) => (
            <button className={status === item ? 'active' : ''} key={item} type="button" onClick={() => setStatus(item)}>
              {statusLabels[item]} <span>{leadCounts[item] || 0}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">Loading leads...</div>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Company</th>
                <th>Source</th>
                <th>Follow-up</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan="8">No leads found.</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.name}</td>
                    <td>{lead.email}</td>
                    <td>{lead.phone}</td>
                    <td>{lead.company}</td>
                    <td>{lead.source}</td>
                    <td>{lead.followUpDate || 'Not set'}</td>
                    <td>
                      {editingLeadId === lead.id ? (
                        <select
                          className="status-edit-select"
                          value={editingStatus}
                          onChange={(event) => setEditingStatus(event.target.value)}
                        >
                          {statusOptions.map((item) => (
                            <option key={item} value={item}>
                              {statusLabels[item]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`status-pill status-${lead.status}`}>{statusLabels[lead.status] || lead.status}</span>
                      )}
                    </td>
                    <td>
                      {editingLeadId === lead.id ? (
                        <div className="table-actions">
                          <button className="primary compact-button" type="button" onClick={() => saveStatusEdit(lead.id)} disabled={updatingStatus}>
                            {updatingStatus ? 'Saving...' : 'Save'}
                          </button>
                          <button className="secondary compact-button" type="button" onClick={cancelStatusEdit} disabled={updatingStatus}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="table-actions">
                          <button className="secondary compact-button" type="button" onClick={() => navigate(`/leads/${lead.id}`)}>
                            View
                          </button>
                          <button className="secondary compact-button" type="button" onClick={() => startStatusEdit(lead)}>
                            Edit
                          </button>
                          <button className="danger compact-button" type="button" onClick={() => deleteLead(lead)}>
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LeadsPage;
