const { getDashboardOverview } = require('../services/bakeryRepository');

const getOverview = async (req, res) => {
  const summary = await getDashboardOverview();
  res.json(summary);
};

module.exports = { getOverview };
