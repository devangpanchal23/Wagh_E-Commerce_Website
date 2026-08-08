const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  mrp: {
    type: Number,
    required: [true, 'MRP is required'],
    min: 0,
  },
  images: {
    type: [mongoose.Schema.Types.Mixed],
    validate: [val => val && val.length > 0, 'At least one product image is required'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  brand: {
    type: String,
    default: 'WAGH',
  },
  specs: {
    outputPower: { type: String, default: '' },
    compatibility: { type: String, default: '' },
    cableLength: { type: String, default: '' },
    dimensions: { type: String, default: '' },
    size: { type: String, default: '' },
    height: { type: String, default: '' },
    width: { type: String, default: '' },
    warranty: { type: String, default: '24 Months' },
    color: { type: String, default: 'Deep Teal' },
    material: { type: String, default: '' },
  },
  sections: [
    {
      title: { type: String, required: true },
      type: { type: String, enum: ['list', 'table', 'text'], default: 'table' },
      items: [
        {
          label: { type: String, default: '' },
          value: { type: String, default: '' }
        }
      ],
      content: { type: String, default: '' },
      order: { type: Number, default: 0 }
    }
  ],
  stock: {
    type: Number,
    required: true,
    default: 100,
  },
  ratingAvg: {
    type: Number,
    default: 4.8,
    min: 0,
    max: 5,
  },
  ratingCount: {
    type: Number,
    default: 24,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isNewArrival: {
    type: Boolean,
    default: false,
  },
  isBestSeller: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

productSchema.index({ name: 'text', description: 'text', brand: 'text' });

// Auto-generate slug from name if not explicitly provided
productSchema.pre('validate', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
