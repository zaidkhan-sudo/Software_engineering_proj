const express = require('express');
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// All notification routes are protected
router.use(auth);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
