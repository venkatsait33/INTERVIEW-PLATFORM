/**
 * Interview Routes
 */

const express = require('express');
const router = express.Router();
const {
  scheduleInterview,
  getInterviews,
  getInterview,
  startSession,
  joinLobby,
  admitCandidate,
  submitFeedback,
  cancelInterview,
} = require('../controllers/interviewController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(requireAuth);

// Get all interviews (role-filtered automatically)
router.get('/', getInterviews);

// Get single interview
router.get('/:id', getInterview);

// HR creates an interview
router.post('/', requireRole('hr', 'admin'), validate('scheduleInterview'), scheduleInterview);

// Interviewer starts the session
router.post('/:id/start', requireRole('interviewer'), startSession);

// Candidate joins the lobby
router.post('/:id/lobby', requireRole('candidate'), joinLobby);

// Interviewer admits candidate
router.post('/:id/admit', requireRole('interviewer'), admitCandidate);

// Interviewer submits feedback and completes interview
router.post('/:id/feedback', requireRole('interviewer'), validate('submitFeedback'), submitFeedback);

// HR cancels interview
router.patch('/:id/cancel', requireRole('hr', 'admin'), cancelInterview);

module.exports = router;
