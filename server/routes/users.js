/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  getInterviewers,
  getCandidates,
} = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All user routes require auth
router.use(requireAuth);

// Admin only: list/manage all users
router.get('/', requireRole('admin'), getUsers);
router.get('/:id', requireRole('admin'), getUserById);
router.patch('/:id', requireRole('admin'), validate('updateUser'), updateUser);

// HR can list interviewers and candidates for scheduling
router.get('/list/interviewers', requireRole('admin', 'hr'), getInterviewers);
router.get('/list/candidates', requireRole('admin', 'hr'), getCandidates);

module.exports = router;
