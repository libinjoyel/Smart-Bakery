const { getSalesLedger, getSalesHistoryReport, getMonthlyProfit, getWasteReports } = require('../services/bakeryRepository');

const getLedger = async (req, res) => {
  res.json(await getSalesLedger());
};

const getHistory = async (req, res) => {
  res.json(await getSalesHistoryReport());
};

const getProfitSummary = async (req, res) => {
  res.json(await getMonthlyProfit());
};

const getWasteReport = async (req, res) => {
  res.json({
    success: true,
    data: await getWasteReports(),
  });
};

module.exports = { getLedger, getHistory, getProfitSummary, getWasteReport };
