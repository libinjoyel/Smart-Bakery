const express = require('express');
const { getOverview } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/summary', getOverview);

module.exports = router;
