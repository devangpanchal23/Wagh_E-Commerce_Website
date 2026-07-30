const express = require('express');
const router = express.Router();
const { subscribeNewsletter, submitContact, getAdminStats } = require('../controllers/extraController');
const { protect, admin } = require('../middleware/auth');

router.post('/newsletter/subscribe', subscribeNewsletter);
router.post('/contact', submitContact);
router.get('/admin/stats', protect, admin, getAdminStats);

module.exports = router;
