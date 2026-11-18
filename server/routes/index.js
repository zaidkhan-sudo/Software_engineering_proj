const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const departmentRoutes = require('./departmentRoutes');
const userRoutes = require('./userRoutes');
const categoryRoutes = require('./categoryRoutes');
const grievanceRoutes = require('./grievanceRoutes');
const notificationRoutes = require('./notificationRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const jobRoutes = require('./jobRoutes');

// Mount routes under /api/v1
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/grievances', grievanceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/jobs', jobRoutes);

module.exports = router;
