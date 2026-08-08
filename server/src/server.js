const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const extraRoutes = require('./routes/extraRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const path = require('path');

// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS configuration
const allowedOrigins = process.env.CLIENT_URL
  ? (process.env.CLIENT_URL.includes(',') ? process.env.CLIENT_URL.split(',').map(url => url.trim()) : process.env.CLIENT_URL.trim())
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded product images statically
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300, // limit each IP
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// API Routes (versioned /api/v1)
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1', extraRoutes);

// Razorpay Direct Alias Routes (Step 1 & Step 3 requirements)
const { createRazorpayOrder, verifyRazorpayPayment } = require('./controllers/orderController');
const { protect } = require('./middleware/auth');
app.post('/api/create-order', protect, createRazorpayOrder);
app.post('/api/verify-payment', protect, verifyRazorpayPayment);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'WAGH Mobile Accessories API is healthy & running', timestamp: new Date() });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5050;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wagh-ecommerce';

let server;

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');
    server = app.listen(PORT, () => {
      console.log(`🚀 WAGH Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    // Start server anyway so mock endpoints can function if needed
    server = app.listen(PORT, () => {
      console.log(`⚠️ WAGH Server listening on port ${PORT} (Database disconnected mode)`);
    });
  });

const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down server...`);
  if (server) {
    server.close(() => {
      console.log('HTTP server closed.');
      mongoose.connection.close(false)
        .then(() => {
          console.log('MongoDB connection closed.');
          process.exit(0);
        })
        .catch(() => process.exit(0));
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = app;
