const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const departmentRoutes = require('./departmentRoutes');
const userRoutes = require('./userRoutes');
const categoryRoutes = require('./categoryRoutes');
const grievanceRoutes = require('./grievanceRoutes');

// Mount routes under /api/v1
router.use('/auth', authRoutes);
router.use('/departments', departmentRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/grievances', grievanceRoutes);

module.exports = router;
