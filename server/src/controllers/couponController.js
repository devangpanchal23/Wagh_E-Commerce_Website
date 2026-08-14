const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper function to calculate server-side authoritative cart total
async function calculateCartTotal(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart || !cart.items || cart.items.length === 0) {
    return 0;
  }

  const productIds = cart.items.map(item => item.product);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map(p => [p._id.toString(), p.price]));

  let total = 0;
  for (const item of cart.items) {
    const price = productMap.get(item.product.toString()) || item.priceAtAdd || 0;
    total += price * item.qty;
  }
  return total;
}

// Client: Apply coupon to cart
exports.applyCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode || typeof couponCode !== 'string' || !couponCode.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid coupon code.' });
    }

    const codeUpper = couponCode.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: codeUpper });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon code not found.' });
    }

    if (coupon.status !== 'published') {
      return res.status(400).json({ success: false, message: 'This coupon is not currently active.' });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ success: false, message: 'This coupon code has expired.' });
    }

    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon redemption limit has been reached.' });
    }

    // Server-side authoritative cart calculation
    const cartTotal = await calculateCartTotal(req.user._id);

    if (cartTotal < coupon.minCartValue) {
      const shortfall = coupon.minCartValue - cartTotal;
      return res.status(400).json({
        success: false,
        message: `Cart total must reach ₹${coupon.minCartValue.toLocaleString('en-IN')} to unlock code ${coupon.code}. Add ₹${shortfall.toLocaleString('en-IN')} more to your cart!`,
        minCartValue: coupon.minCartValue,
        shortfall,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountCap && coupon.maxDiscountCap > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountCap);
      }
    } else if (coupon.discountType === 'flat') {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, cartTotal);
    const finalTotal = Math.max(0, cartTotal - discountAmount);

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully!`,
      data: {
        couponCode: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
        cartTotal,
        finalTotal: Math.round(finalTotal * 100) / 100,
        minCartValue: coupon.minCartValue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create new coupon (defaults to draft)
exports.createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minCartValue,
      maxDiscountCap,
      expiryDate,
      usageLimit,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Code, discountType, discountValue, and expiryDate are required.',
      });
    }

    const codeUpper = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: codeUpper });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon with code '${codeUpper}' already exists.` });
    }

    const coupon = await Coupon.create({
      code: codeUpper,
      discountType,
      discountValue: Number(discountValue),
      minCartValue: Number(minCartValue || 0),
      maxDiscountCap: maxDiscountCap ? Number(maxDiscountCap) : null,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      status: 'draft',
      createdBy: req.user?._id || req.admin?.id || null,
    });

    res.status(201).json({
      success: true,
      data: coupon,
      message: `Coupon '${coupon.code}' created as draft.`,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all coupons
exports.getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      data: coupons,
      message: 'Coupons retrieved successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update coupon
exports.updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      discountType,
      discountValue,
      minCartValue,
      maxDiscountCap,
      expiryDate,
      usageLimit,
    } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    if (code) coupon.code = code.trim().toUpperCase();
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
    if (minCartValue !== undefined) coupon.minCartValue = Number(minCartValue);
    if (maxDiscountCap !== undefined) coupon.maxDiscountCap = maxDiscountCap ? Number(maxDiscountCap) : null;
    if (expiryDate) coupon.expiryDate = new Date(expiryDate);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit ? Number(usageLimit) : null;

    await coupon.save();

    res.status(200).json({
      success: true,
      data: coupon,
      message: `Coupon '${coupon.code}' updated successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Publish coupon
exports.publishCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    coupon.status = 'published';
    await coupon.save();

    res.status(200).json({
      success: true,
      data: coupon,
      message: `Coupon '${coupon.code}' is now published and live!`,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Unpublish coupon
exports.unpublishCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    coupon.status = 'draft';
    await coupon.save();

    res.status(200).json({
      success: true,
      data: coupon,
      message: `Coupon '${coupon.code}' reverted to draft.`,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete coupon
exports.deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' deleted.`,
    });
  } catch (error) {
    next(error);
  }
};
