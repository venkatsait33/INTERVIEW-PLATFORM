/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/register', validate('register'), register);
router.post('/login', validate('login'), login);
router.get('/me', requireAuth, getMe);

module.exports = router;
