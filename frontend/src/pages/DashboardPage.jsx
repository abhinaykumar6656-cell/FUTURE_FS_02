import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { statusLabels } from '../constants/statuses';
import api from '../services/api';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    total: 0,
    newCount: 0,
    contactedCount: 0,
    qualifiedCount: 0,
    proposalCount: 0,
    convertedCount: 0,
    lostCount: 0,
    openCount: 0,
    conversionRate: 0,
    monthlyData: [],
    followUpsDue: [],
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.email}</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <span>Total leads</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric-card">
          <span>New leads</span>
          <strong>{stats.newCount}</strong>
        </div>
        <div className="metric-card">
          <span>Contacted</span>
          <strong>{stats.contactedCount}</strong>
        </div>
        <div className="metric-card">
          <span>Open pipeline</span>
          <strong>{stats.openCount}</strong>
        </div>
        <div className="metric-card">
          <span>Converted</span>
          <strong>{stats.convertedCount}</strong>
        </div>
        <div className="metric-card">
          <span>Lost</span>
          <strong>{stats.lostCount}</strong>
        </div>
        <div className="metric-card full-width">
          <span>Conversion rate</span>
          <strong>{stats.conversionRate}%</strong>
        </div>
      </div>

      <section className="panel reminder-panel">
        <div className="panel-header">
          <h2>Due Follow-ups</h2>
          <Link className="secondary button-link" to="/leads">View leads</Link>
        </div>
        {stats.followUpsDue.length === 0 ? (
          <div className="empty-state">No follow-ups due today.</div>
        ) : (
          <div className="reminder-list">
            {stats.followUpsDue.map((lead) => (
              <Link className="reminder-row" to={`/leads/${lead.id}`} key={lead.id}>
                <span>{lead.followUpDate}</span>
                <strong>{lead.name}</strong>
                <small>{lead.company} · {statusLabels[lead.status] || lead.status}</small>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
