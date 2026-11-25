const express = require('express');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const analyticsRoutes = require('./analyticsRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
