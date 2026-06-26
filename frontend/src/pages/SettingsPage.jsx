import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { statusLabels, statusOptions } from '../constants/statuses';

const defaultSettings = {
  compactTables: false,
  emailAlerts: true,
  followUpReminders: true,
  defaultStatus: 'new',
};

const SettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedSettings = localStorage.getItem('crmSettings');
    if (storedSettings) {
      setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
    }
  }, []);

  const updateSetting = (key, value) => {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = (event) => {
    event.preventDefault();
    localStorage.setItem('crmSettings', JSON.stringify(settings));
    setSaved(true);
  };

  return (
    <div className="settings-page">
      <div className="dashboard-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your local workspace preferences and CRM defaults.</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Workspace</h2>
          </div>
          <form className="settings-form" onSubmit={saveSettings}>
            <label className="toggle-row">
              <span>
                <strong>Compact lead table</strong>
                <small>Reduce spacing for faster scanning.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.compactTables}
                onChange={(event) => updateSetting('compactTables', event.target.checked)}
              />
            </label>

            <label className="toggle-row">
              <span>
                <strong>Email alerts</strong>
                <small>Mark new lead notifications as enabled.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.emailAlerts}
                onChange={(event) => updateSetting('emailAlerts', event.target.checked)}
              />
            </label>

            <label className="toggle-row">
              <span>
                <strong>Follow-up reminders</strong>
                <small>Keep reminders active for contacted leads.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.followUpReminders}
                onChange={(event) => updateSetting('followUpReminders', event.target.checked)}
              />
            </label>

            <label className="field-row">
              <span>Default lead status</span>
              <select
                value={settings.defaultStatus}
                onChange={(event) => updateSetting('defaultStatus', event.target.value)}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </label>

            <div className="settings-actions">
              <button className="primary" type="submit">Save settings</button>
              {saved && <span className="save-confirmation">Saved</span>}
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Account</h2>
          </div>
          <div className="info-list">
            <div>
              <span>Signed in as</span>
              <strong>{user?.email || 'Local admin'}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>Administrator</strong>
            </div>
            <div>
              <span>API server</span>
              <strong>{import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}</strong>
            </div>
            <div>
              <span>Storage mode</span>
              <strong>Local JSON fallback</strong>
            </div>
          </div>
        </section>

        <section className="panel settings-wide">
          <div className="panel-header">
            <h2>Pipeline Defaults</h2>
          </div>
          <div className="preference-cards">
            {statusOptions.map((status) => (
              <div key={status}>
                <span className={`status-pill status-${status}`}>{statusLabels[status]}</span>
                <p>{status === 'lost' ? 'Close out leads that are no longer active.' : 'Use this stage to keep pipeline movement visible.'}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
