import { useState } from 'react';
import Toast from '../components/Toast';
import api from '../services/api';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  source: 'Website contact form',
  message: '',
};

const ContactPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitContact = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/contact', form);
      setForm(emptyForm);
      setToast({ type: 'success', message: 'Request sent. The lead is now in the CRM.' });
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: 'Could not submit request.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="contact-shell">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <section className="contact-card">
        <div>
          <span className="eyebrow">Mini CRM intake</span>
          <h1>Start a conversation</h1>
          <p>Every submission becomes a lead with the message saved as the first follow-up note.</p>
        </div>
        <form className="contact-form" onSubmit={submitContact}>
          <input name="name" placeholder="Name" value={form.name} onChange={updateField} required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={updateField} required />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={updateField} />
          <input name="company" placeholder="Company" value={form.company} onChange={updateField} />
          <textarea name="message" placeholder="What can we help with?" value={form.message} onChange={updateField} required />
          <button className="primary" type="submit" disabled={saving}>{saving ? 'Sending...' : 'Send request'}</button>
        </form>
      </section>
    </div>
  );
};

export default ContactPage;
