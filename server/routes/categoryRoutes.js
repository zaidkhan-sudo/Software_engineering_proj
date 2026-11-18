const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const auth = require('../middleware/auth');

// Categories are accessible to all authenticated users (Citizen, Officer, Admin)
router.use(auth);

router.get('/', categoryController.getCategories);

module.exports = router;
