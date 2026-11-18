const express = require('express');
const router = express.Router();

const grievanceController = require('../controllers/grievanceController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { uploadAttachments } = require('../middleware/upload');
const { ROLES } = require('../utils/constants');
const { createGrievanceSchema } = require('../validations/grievanceValidation');
const {
  updateStatusSchema,
  assignGrievanceSchema,
  addCommentSchema,
  feedbackSchema,
  reopenSchema
} = require('../validations/grievanceActionValidation');

// All grievance endpoints require an authenticated user
router.use(auth);

// 1. File new grievance (Citizen only, multipart upload)
router.post(
  '/',
  authorize(ROLES.CITIZEN),
  uploadAttachments,
  validate(createGrievanceSchema),
  grievanceController.createGrievance
);

// 2. List grievances (role-scoped, paginated, filtered)
router.get('/', grievanceController.getGrievances);

// 3. Look up grievance by tracking ID (must be registered BEFORE /:id)
router.get('/track/:trackingId', grievanceController.getGrievanceByTrackingId);

// 4. Stream image attachment binary
router.get('/:id/attachments/:index', grievanceController.streamAttachment);

// 5. Update grievance status (Officer of department, Admin)
router.patch(
  '/:id/status',
  authorize(ROLES.OFFICER, ROLES.ADMIN),
  validate(updateStatusSchema),
  grievanceController.updateStatus
);

// 6. Assign / reassign grievance (Admin only)
router.patch(
  '/:id/assign',
  authorize(ROLES.ADMIN),
  validate(assignGrievanceSchema),
  grievanceController.assignGrievance
);

// 7. Add comments or internal staff notes
router.post(
  '/:id/comments',
  validate(addCommentSchema),
  grievanceController.addComment
);

// 8. Submit citizen feedback for resolved grievance
router.post(
  '/:id/feedback',
  authorize(ROLES.CITIZEN),
  validate(feedbackSchema),
  grievanceController.addFeedback
);

// 9. Reopen resolved/rejected grievance (Citizen only, max once)
router.post(
  '/:id/reopen',
  authorize(ROLES.CITIZEN),
  validate(reopenSchema),
  grievanceController.reopenGrievance
);

// 10. Get grievance details by MongoDB ObjectId
router.get('/:id', grievanceController.getGrievanceById);

module.exports = router;
