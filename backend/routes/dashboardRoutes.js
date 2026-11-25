const express = require('express');
const { getOverview } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.get('/summary', getOverview);

module.exports = router;
