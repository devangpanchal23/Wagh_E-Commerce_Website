const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');

// @desc    Admin authentication with username & password
// @route   POST /api/v1/admin/login
exports.adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide admin username and password',
      });
    }

    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const envPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const envPlainPassword = process.env.ADMIN_PASSWORD || 'admin2026';

    if (username.trim() !== expectedUsername) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin username or password',
      });
    }

    let isMatch = false;

    // Check against bcrypt hash if available
    if (envPasswordHash) {
      try {
        isMatch = await bcrypt.compare(password.trim(), envPasswordHash);
      } catch (err) {
        isMatch = false;
      }
    }

    // Fallback to plain env password check if hash comparison wasn't successful
    if (!isMatch && envPlainPassword) {
      isMatch = password.trim() === envPlainPassword.trim();
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin username or password',
      });
    }

    const adminSecret = process.env.ADMIN_JWT_SECRET || 'wagh_admin_dedicated_jwt_secret_key_2026_secure';
    const token = jwt.sign(
      {
        username: expectedUsername,
        role: 'admin',
        type: 'admin_session',
      },
      adminSecret,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      token,
      expiresIn: 8 * 3600,
      admin: {
        username: expectedUsername,
        role: 'admin',
      },
      message: 'Admin authentication successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin logout endpoint
// @route   POST /api/v1/admin/logout
exports.adminLogout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Admin session terminated successfully',
  });
};

// @desc    Verify current admin token
// @route   GET /api/v1/admin/verify
exports.verifyAdminSession = async (req, res) => {
  return res.status(200).json({
    success: true,
    admin: req.admin,
    message: 'Admin session is active and valid',
  });
};

// @desc    Get dashboard analytics & statistics
// @route   GET /api/v1/admin/stats
exports.getAdminStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const completedOrders = await Order.countDocuments({ orderStatus: { $in: ['Delivered', 'Completed'] } });

    const allOrders = await Order.find();
    const totalRevenue = allOrders.reduce((acc, item) => acc + (item.total || 0), 0);

    const now = new Date();
    const lastYear = now.getFullYear() - 1;
    const startOfLastYear = new Date(lastYear, 0, 1);
    const endOfLastYear = new Date(lastYear, 11, 31, 23, 59, 59);

    const lastYearOrders = allOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= startOfLastYear && d <= endOfLastYear;
    });

    const lastYearRevenue = lastYearOrders.reduce((acc, item) => acc + (item.total || 0), 0);
    const lastYearCompletedOrders = lastYearOrders.filter(
      (o) => o.orderStatus === 'Delivered' || o.orderStatus === 'Completed'
    ).length;

    const pendingOrders = await Order.countDocuments({ orderStatus: 'Processing' });
    const recentOrders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        pendingOrders,
        completedOrders,
        lastYearRevenue,
        lastYearTotalOrders: lastYearOrders.length,
        lastYearCompletedOrders,
        recentOrders,
      },
      message: 'Admin statistics retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for admin timeline
// @route   GET /api/v1/admin/orders
exports.getAdminOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: orders,
      message: 'All orders fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/v1/admin/orders/:id/status
exports.updateAdminOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    if (!orderStatus) {
      return res.status(400).json({ success: false, message: 'Please provide orderStatus' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = orderStatus;
    if (orderStatus === 'Delivered' || orderStatus === 'Completed') {
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.json({
      success: true,
      data: order,
      message: `Order status updated to ${orderStatus}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin product list
// @route   GET /api/v1/admin/products
exports.getAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate('category').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: products,
      message: 'Products catalog retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product (admin)
// @route   POST /api/v1/admin/products
exports.createAdminProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (admin)
// @route   PUT /api/v1/admin/products/:id
exports.updateAdminProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (admin)
// @route   DELETE /api/v1/admin/products/:id
exports.deleteAdminProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin categories
// @route   GET /api/v1/admin/categories
exports.getAdminCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.json({
      success: true,
      data: categories,
      message: 'Categories fetched successfully',
    });
  } catch (error) {
    next(error);
  }
};
