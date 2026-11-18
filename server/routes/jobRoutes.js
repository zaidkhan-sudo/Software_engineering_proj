const express = require('express');
const jobController = require('../controllers/jobController');

const router = express.Router();

// POST /jobs/escalate (auth handled inside controller via dual strategy: admin Bearer or x-cron-secret)
router.post('/escalate', jobController.triggerEscalation);

module.exports = router;
