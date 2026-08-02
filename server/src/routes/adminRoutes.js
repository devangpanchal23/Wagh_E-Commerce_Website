const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  adminLogin,
  adminLogout,
  verifyAdminSession,
  getAdminStats,
  getAdminOrders,
  updateAdminOrderStatus,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
} = require('../controllers/adminController');
const { verifyAdminToken } = require('../middleware/adminAuth');

// Rate limiter specifically for admin login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 login attempts per window per IP
  message: {
    success: false,
    message: 'Too many admin login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public admin auth endpoints
router.post('/login', loginLimiter, adminLogin);
router.post('/logout', adminLogout);

// Protected admin endpoints — ALL use verifyAdminToken middleware exclusively
router.use(verifyAdminToken);

router.get('/verify', verifyAdminSession);
router.get('/stats', getAdminStats);
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateAdminOrderStatus);

router.get('/products', getAdminProducts);
router.post('/products', createAdminProduct);
router.put('/products/:id', updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);

router.get('/categories', getAdminCategories);

module.exports = router;
