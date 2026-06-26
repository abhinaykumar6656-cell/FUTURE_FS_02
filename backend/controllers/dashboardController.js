const { db, isFirebaseConfigured } = require('../config/firebase');
const { readData } = require('../utils/localStore');

const LEADS_COLLECTION = 'leads';
const OPEN_STATUSES = ['new', 'contacted', 'qualified', 'proposal'];

const getStats = async (req, res) => {
  try {
    let leads;
    if (isFirebaseConfigured) {
      const snapshot = await db.collection(LEADS_COLLECTION).get();
      leads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } else {
      leads = readData().leads;
    }

    const total = leads.length;
    const newCount = leads.filter((lead) => lead.status === 'new').length;
    const contactedCount = leads.filter((lead) => lead.status === 'contacted').length;
    const qualifiedCount = leads.filter((lead) => lead.status === 'qualified').length;
    const proposalCount = leads.filter((lead) => lead.status === 'proposal').length;
    const convertedCount = leads.filter((lead) => lead.status === 'converted').length;
    const lostCount = leads.filter((lead) => lead.status === 'lost').length;
    const openCount = leads.filter((lead) => OPEN_STATUSES.includes(lead.status || 'new')).length;
    const conversionRate = total === 0 ? 0 : Math.round((convertedCount / total) * 100);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const followUpsDue = leads
      .filter((lead) => lead.followUpDate && !['converted', 'lost'].includes(lead.status))
      .filter((lead) => {
        const followUpDate = new Date(`${lead.followUpDate}T00:00:00`);
        return followUpDate < tomorrow;
      })
      .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
      .slice(0, 6);

    const monthlyGrowth = leads.reduce((agg, lead) => {
      const date = lead.createdAt?.toDate ? lead.createdAt.toDate() : new Date(lead.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      agg[monthKey] = (agg[monthKey] || 0) + 1;
      return agg;
    }, {});

    const monthlyData = Object.entries(monthlyGrowth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    const sourceData = Object.entries(
      leads.reduce((agg, lead) => {
        const source = lead.source || 'Unknown';
        agg[source] = (agg[source] || 0) + 1;
        return agg;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count }));

    return res.json({
      total,
      newCount,
      contactedCount,
      qualifiedCount,
      proposalCount,
      convertedCount,
      lostCount,
      openCount,
      conversionRate,
      monthlyData,
      sourceData,
      followUpsDue,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch stats.', error: error.message });
  }
};

module.exports = { dashboardController: { getStats } };
