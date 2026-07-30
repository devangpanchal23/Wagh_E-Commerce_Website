const Subscriber = require('../models/Subscriber');
const Contact = require('../models/Contact');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

exports.subscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    let sub = await Subscriber.findOne({ email });
    if (sub) {
      return res.json({ success: true, message: 'You are already subscribed to the WAGH insider list!' });
    }

    sub = await Subscriber.create({ email });
    res.status(201).json({
      success: true,
      data: sub,
      message: 'Thank you for subscribing to WAGH insider!'
    });
  } catch (error) {
    next(error);
  }
};

exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }

    const contact = await Contact.create({ name, email, phone, subject, message });
    res.status(201).json({
      success: true,
      data: contact,
      message: 'Message sent successfully! Our team will contact you shortly.'
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    
    const orders = await Order.find();
    const totalRevenue = orders.reduce((acc, item) => acc + item.total, 0);

    const pendingOrders = await Order.countDocuments({ orderStatus: 'Processing' });
    const recentOrders = await Order.find().populate('user', 'name').sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        pendingOrders,
        recentOrders,
      },
      message: 'Admin stats retrieved'
    });
  } catch (error) {
    next(error);
  }
};
