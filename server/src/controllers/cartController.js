const Cart = require('../models/Cart');

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json({
      success: true,
      data: cart,
      message: 'Cart fetched'
    });
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, qty = 1, price } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].qty += qty;
    } else {
      cart.items.push({ product: productId, qty, priceAtAdd: price });
    }

    await cart.save();
    cart = await Cart.findById(cart._id).populate('items.product');

    res.json({
      success: true,
      data: cart,
      message: 'Item added to cart'
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCartQty = async (req, res, next) => {
  try {
    const { productId, qty } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      if (qty <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].qty = qty;
      }
      await cart.save();
    }
    cart = await Cart.findById(cart._id).populate('items.product');

    res.json({
      success: true,
      data: cart,
      message: 'Cart updated'
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
    await cart.save();
    cart = await Cart.findById(cart._id).populate('items.product');

    res.json({
      success: true,
      data: cart,
      message: 'Item removed from cart'
    });
  } catch (error) {
    next(error);
  }
};

exports.syncCart = async (req, res, next) => {
  try {
    const { items } = req.body; // array of { productId, qty, price }
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    if (Array.isArray(items)) {
      items.forEach(localItem => {
        const idx = cart.items.findIndex(i => i.product.toString() === localItem.productId);
        if (idx > -1) {
          cart.items[idx].qty = Math.max(cart.items[idx].qty, localItem.qty);
        } else {
          cart.items.push({
            product: localItem.productId,
            qty: localItem.qty,
            priceAtAdd: localItem.price
          });
        }
      });
      await cart.save();
    }

    cart = await Cart.findById(cart._id).populate('items.product');
    res.json({
      success: true,
      data: cart,
      message: 'Cart synced'
    });
  } catch (error) {
    next(error);
  }
};
