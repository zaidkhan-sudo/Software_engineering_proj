const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../utils/constants');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Admin-only endpoints
router.use(auth, authorize(ROLES.ADMIN));

router.get('/summary', analyticsController.getSummary);
router.get('/by-category', analyticsController.getByCategory);
router.get('/resolution-time', analyticsController.getResolutionTime);

module.exports = router;
