const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get products with search, filter, sort & pagination
// @route   GET /api/v1/products
exports.getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = {};

    // Search query
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { brand: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Category filter
    if (req.query.category) {
      const categories = req.query.category.split(',');
      const catObjs = await Category.find({
        $or: [{ _id: { $in: categories.filter(c => c.match(/^[0-9a-fA-F]{24}$/)) } }, { slug: { $in: categories } }]
      });
      if (catObjs.length > 0) {
        query.category = { $in: catObjs.map(c => c._id) };
      }
    }

    // Brand filter
    if (req.query.brand) {
      const brands = req.query.brand.split(',');
      query.brand = { $in: brands };
    }

    // In Stock filter
    if (req.query.inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Sorting
    let sort = { createdAt: -1 }; // default newest
    if (req.query.sort === 'price-asc') sort = { price: 1 };
    else if (req.query.sort === 'price-desc') sort = { price: -1 };
    else if (req.query.sort === 'popularity') sort = { ratingCount: -1, ratingAvg: -1 };
    else if (req.query.sort === 'newest') sort = { createdAt: -1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: {
        products,
        page,
        pages: Math.ceil(total / limit),
        total,
      },
      message: 'Products fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or slug
// @route   GET /api/v1/products/:id
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).populate('category', 'name slug');
    } else {
      product = await Product.findOne({ slug: id }).populate('category', 'name slug');
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: product,
      message: 'Product fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product (Admin)
// @route   POST /api/v1/products
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, mrp, images, category, brand, specs, stock, isFeatured, isNewArrival, isBestSeller } = req.body;
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now();

    const product = await Product.create({
      name,
      slug,
      description,
      price,
      mrp,
      images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop'],
      category,
      brand: brand || 'WAGH',
      specs: specs || {},
      stock: stock || 100,
      isFeatured: !!isFeatured,
      isNewArrival: !!isNewArrival,
      isBestSeller: !!isBestSeller,
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/v1/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    Object.assign(product, req.body);
    if (req.body.name) {
      product.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const updatedProduct = await product.save();

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/v1/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: null,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get home page collections (Featured, Best Sellers, New Arrivals)
// @route   GET /api/v1/products/collections/featured
exports.getHomeCollections = async (req, res, next) => {
  try {
    const bestSellers = await Product.find({ isBestSeller: true }).populate('category', 'name slug').limit(8);
    const newArrivals = await Product.find({ isNewArrival: true }).populate('category', 'name slug').limit(8);
    const featured = await Product.find({ isFeatured: true }).populate('category', 'name slug').limit(8);

    res.json({
      success: true,
      data: {
        bestSellers,
        newArrivals,
        featured,
      },
      message: 'Home collections fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};
