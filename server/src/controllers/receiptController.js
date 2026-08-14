const Order = require('../models/Order');
const PaymentReceipt = require('../models/PaymentReceipt');

const COMPANY_DETAILS = {
  name: process.env.COMPANY_NAME || 'Wagh Mobile Accessories',
  gstin: process.env.COMPANY_GSTIN || '27AAACW1234A1Z5',
  email: process.env.COMPANY_EMAIL || 'support@waghmobile.com',
  phone: process.env.COMPANY_PHONE || '+91 98765 43210',
  address: process.env.COMPANY_ADDRESS || 'Wagh Mobile Accessories, Main Market, Mumbai, MH - 400001',
};

// Helper to generate sequential-style receipt number
function generateReceiptNumber(orderId) {
  const timestamp = Date.now().toString().slice(-6);
  const cleanId = (orderId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return `WAG-PAY-${new Date().getFullYear()}-${cleanId || timestamp}`;
}

// Get Payment Receipt (Financial Record)
exports.getPaymentReceipt = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [{ _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }, { orderId: orderId }]
    }).populate('user', 'name email mobileNumber').lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to payment receipt' });
    }

    // Retrieve or auto-create PaymentReceipt record
    let receipt = await PaymentReceipt.findOne({ order: order._id }).lean();

    if (!receipt) {
      const receiptNumber = generateReceiptNumber(order.orderId);
      const subtotal = order.subtotal || order.total || 0;
      const gstAmount = order.gstAmount || Math.round(subtotal * 0.18 * 100) / 100;
      const cgst = order.gstBreakdown?.cgst || Math.round((gstAmount / 2) * 100) / 100;
      const sgst = order.gstBreakdown?.sgst || Math.round((gstAmount / 2) * 100) / 100;

      const paymentDate = order.createdAt || new Date();
      const paymentTime = new Date(paymentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      receipt = await PaymentReceipt.create({
        receiptNumber,
        order: order._id,
        orderIdString: order.orderId,
        user: order.user._id,
        paymentDate,
        paymentTime,
        paymentMode: order.paymentMethod || 'COD',
        gatewayTransactionId: order.razorpayPaymentId || order.razorpayOrderId || (order.paymentMethod === 'COD' ? 'COD-' + order.orderId : 'N/A'),
        subtotal,
        gstAmount,
        gstBreakdown: { cgst, sgst, igst: 0 },
        couponCode: order.couponCode || '',
        couponDiscountAmount: order.couponDiscount || order.discount || 0,
        finalAmountPaid: order.total,
        paymentStatus: order.paymentStatus === 'Paid' ? 'Success' : 'Pending',
      });
      receipt = receipt.toObject();
    }

    res.status(200).json({
      success: true,
      message: 'Payment receipt fetched successfully',
      data: {
        receipt,
        order: {
          orderId: order.orderId,
          createdAt: order.createdAt,
          itemsCount: order.items?.length || 0,
          shippingAddress: order.shippingAddress,
        },
        customer: {
          name: order.user?.name || order.shippingAddress?.name || 'Customer',
          email: order.user?.email || '',
          phone: order.shippingAddress?.phone || order.user?.mobileNumber || '',
        },
        company: COMPANY_DETAILS,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Product Purchase Invoice (Tax Invoice)
exports.getPurchaseInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [{ _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }, { orderId: orderId }]
    }).populate('user', 'name email mobileNumber').lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to purchase invoice' });
    }

    const subtotal = order.subtotal || 0;
    const shippingFee = order.shippingFee || 0;
    const discount = order.couponDiscount || order.discount || 0;
    const gstAmount = order.gstAmount || Math.round((subtotal - discount) * 0.18 * 100) / 100;
    const cgst = order.gstBreakdown?.cgst || Math.round((gstAmount / 2) * 100) / 100;
    const sgst = order.gstBreakdown?.sgst || Math.round((gstAmount / 2) * 100) / 100;
    const invoiceNumber = `INV-${(order.orderId || '').replace('WAGH-', '')}-${new Date(order.createdAt).getFullYear()}`;

    // Itemized lines
    const lineItems = (order.items || []).map((item, idx) => ({
      srNo: idx + 1,
      name: item.name,
      sku: item.sku || `WAGH-SKU-${(item.product || '').toString().slice(-6).toUpperCase()}`,
      qty: item.qty,
      unitPrice: item.price,
      lineTotal: item.price * item.qty,
      image: item.image,
    }));

    res.status(200).json({
      success: true,
      message: 'Purchase invoice fetched successfully',
      data: {
        invoiceNumber,
        invoiceDate: order.createdAt,
        orderId: order.orderId,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        transactionId: order.razorpayPaymentId || order.razorpayOrderId || (order.paymentMethod === 'COD' ? 'COD-' + order.orderId : 'N/A'),
        lineItems,
        summary: {
          subtotal,
          shippingFee,
          discount,
          couponCode: order.couponCode || '',
          gstAmount,
          gstBreakdown: { cgst, sgst, igst: 0 },
          grandTotal: order.total,
        },
        shippingAddress: order.shippingAddress,
        customer: {
          name: order.shippingAddress?.name || order.user?.name || 'Customer',
          email: order.user?.email || '',
          phone: order.shippingAddress?.phone || order.user?.mobileNumber || '',
        },
        company: COMPANY_DETAILS,
      },
    });
  } catch (error) {
    next(error);
  }
};
