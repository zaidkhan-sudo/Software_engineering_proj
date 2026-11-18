const express = require('express');
const router = express.Router();

const grievanceController = require('../controllers/grievanceController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { uploadAttachments } = require('../middleware/upload');
const { ROLES } = require('../utils/constants');
const { createGrievanceSchema } = require('../validations/grievanceValidation');

// All grievance endpoints require an authenticated user
router.use(auth);

// File new grievance (Citizen only, multipart upload)
router.post(
  '/',
  authorize(ROLES.CITIZEN),
  uploadAttachments,
  validate(createGrievanceSchema),
  grievanceController.createGrievance
);

// List grievances (role-scoped, paginated, filtered)
router.get('/', grievanceController.getGrievances);

// Look up grievance by tracking ID (must be defined BEFORE /:id)
router.get('/track/:trackingId', grievanceController.getGrievanceByTrackingId);

// Stream image attachment binary
router.get('/:id/attachments/:index', grievanceController.streamAttachment);

// Get grievance details by MongoDB ObjectId
router.get('/:id', grievanceController.getGrievanceById);

module.exports = router;
