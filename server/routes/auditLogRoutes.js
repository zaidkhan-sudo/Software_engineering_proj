const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../utils/constants');
const auditLogController = require('../controllers/auditLogController');

const router = express.Router();

// Admin-only route
router.use(auth, authorize(ROLES.ADMIN));

router.get('/', auditLogController.getAuditLogs);

module.exports = router;
