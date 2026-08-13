const Order = require('../models/Order');
const Cart = require('../models/Cart');

exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, subtotal, shippingFee, discount, total } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    const orderId = 'WAGH-' + Math.floor(100000 + Math.random() * 900000);

    const order = await Order.create({
      user: req.user._id,
      orderId,
      items,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'Razorpay' ? 'Paid' : 'Pending',
      subtotal,
      shippingFee: shippingFee || 0,
      discount: discount || 0,
      total,
    });

    // Clear user cart after placing order
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order placed successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .select('orderId items shippingAddress paymentMethod paymentStatus orderStatus subtotal shippingFee discount total createdAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      success: true,
      data: orders,
      message: 'Orders fetched'
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.json({
      success: true,
      data: order,
      message: 'Order details fetched'
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({
      success: true,
      data: orders,
      message: 'All orders fetched'
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    res.json({
      success: true,
      data: order,
      message: 'Order status updated'
    });
  } catch (error) {
    next(error);
  }
};

const Razorpay = require('razorpay');
const crypto = require('crypto');

// Create Razorpay Order (Backend Step 1)
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount provided' });
    }

    // Convert rupees to paise (1 Rupee = 100 Paise)
    const amountInPaise = Math.round(numAmount * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least 100 paise (₹1)',
      });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay credentials not configured in server environment',
      });
    }

    const instance = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };

    const razorpayOrder = await instance.orders.create(options);

    res.status(200).json({
      success: true,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: key_id,
      data: razorpayOrder,
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Razorpay order creation failed',
    });
  }
};

// Verify Razorpay Signature (Backend Step 3)
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)',
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay secret key not configured on server',
      });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return res.status(200).json({
        success: true,
        message: 'Razorpay payment signature verified successfully',
        razorpay_order_id,
        razorpay_payment_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay signature. Payment verification failed.',
      });
    }
  } catch (error) {
    console.error('Razorpay Verification Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Razorpay payment verification failed',
    });
  }
};
