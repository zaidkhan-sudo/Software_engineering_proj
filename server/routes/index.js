const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');

// Mount Auth routes under /api/v1/auth
router.use('/auth', authRoutes);

module.exports = router;
