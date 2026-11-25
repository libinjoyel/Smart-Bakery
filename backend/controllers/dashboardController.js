const { getDashboardOverview } = require('../services/bakeryRepository');

const getOverview = async (req, res) => {
  const summary = await getDashboardOverview();
  if (req.user?.role === 'STAFF') {
    const { grossRevenue, cogs, netProfit, wasteLoss, ...operationalSummary } = summary;
    return res.json(operationalSummary);
  }
  res.json(summary);
};

module.exports = { getOverview };
