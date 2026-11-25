const express = require('express');
const { getLedger, getHistory, getProfitSummary, getWasteReport } = require('../controllers/analyticsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('ADMIN'));

router.get('/ledger', getLedger);
router.get('/history', getHistory);
router.get('/profit', getProfitSummary);
router.get('/waste', getWasteReport);

module.exports = router;
