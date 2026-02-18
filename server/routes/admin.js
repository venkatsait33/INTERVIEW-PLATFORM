/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const { getSystemStats, getActivityLogs } = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));

router.get('/stats', getSystemStats);
router.get('/activity-logs', getActivityLogs);

module.exports = router;
