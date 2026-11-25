const express = require('express');
const { getLedger, getHistory, getProfitSummary, getWasteReport } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/ledger', getLedger);
router.get('/history', getHistory);
router.get('/profit', getProfitSummary);
router.get('/waste', getWasteReport);

module.exports = router;
