import { useEffect, useMemo, useState } from 'react';
import { statusLabels } from '../constants/statuses';
import api from '../services/api';

const AnalyticsPage = () => {
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
    sourceData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const pipeline = [
    { status: 'new', value: stats.newCount },
    { status: 'contacted', value: stats.contactedCount },
    { status: 'qualified', value: stats.qualifiedCount },
    { status: 'proposal', value: stats.proposalCount },
    { status: 'converted', value: stats.convertedCount },
    { status: 'lost', value: stats.lostCount },
  ];

  const bestMonth = useMemo(() => {
    if (!stats.monthlyData.length) return 'No data yet';
    return stats.monthlyData.reduce((best, item) => (item.count > best.count ? item : best)).month;
  }, [stats.monthlyData]);

  const maxMonthlyCount = Math.max(1, ...stats.monthlyData.map((item) => item.count));

  return (
    <div className="analytics-page">
      <div className="dashboard-header">
        <div>
          <h1>Analytics</h1>
          <p>Track lead volume, pipeline mix, and conversion performance.</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <span>Total leads</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric-card">
          <span>Conversion rate</span>
          <strong>{stats.conversionRate}%</strong>
        </div>
        <div className="metric-card">
          <span>Best month</span>
          <strong className="metric-text">{bestMonth}</strong>
        </div>
        <div className="metric-card">
          <span>Open pipeline</span>
          <strong>{stats.openCount}</strong>
        </div>
      </div>

      <div className="analytics-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Pipeline Breakdown</h2>
          </div>
          {loading ? (
            <div className="empty-state">Loading analytics...</div>
          ) : (
            <div className="pipeline-list">
              {pipeline.map((item) => {
                const percent = stats.total === 0 ? 0 : Math.round((item.value / stats.total) * 100);
                return (
                  <div className="pipeline-row" key={item.status}>
                    <div>
                      <span className={`status-pill status-${item.status}`}>{statusLabels[item.status]}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <small>{percent}%</small>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Monthly Leads</h2>
          </div>
          {stats.monthlyData.length === 0 ? (
            <div className="empty-state">Add leads to see monthly trends.</div>
          ) : (
            <div className="bar-chart">
              {stats.monthlyData.map((item) => (
                <div className="bar-item" key={item.month}>
                  <div className="bar-track">
                    <span style={{ height: `${Math.max(12, (item.count / maxMonthlyCount) * 100)}%` }} />
                  </div>
                  <strong>{item.count}</strong>
                  <small>{item.month}</small>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Lead Sources</h2>
          </div>
          {stats.sourceData.length === 0 ? (
            <div className="empty-state">Add leads to compare sources.</div>
          ) : (
            <div className="source-list">
              {stats.sourceData.map((item) => (
                <div className="source-row" key={item.source}>
                  <strong>{item.source}</strong>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPage;
