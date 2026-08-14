const User = require('../models/User');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

const normalizeBirthdate = (value) => {
  if (!value) return '';
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'wagh_super_secret_jwt_key_2026_premium_accessories', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'customer',
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/v1/auth/login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses,
        token,
      },
      message: 'Login successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/v1/auth/profile
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Dynamic age calculation from birthdate if provided
    let computedAge = user.age;
    if (user.birthdate) {
      const dob = new Date(user.birthdate);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        let calc = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          calc--;
        }
        computedAge = calc >= 0 ? calc : 0;
        if (user.age !== computedAge) {
          User.updateOne({ _id: user._id }, { age: computedAge }).catch(() => {});
        }
      }
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        clerkId: user.clerkId || '',
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber || '',
        phone: user.mobileNumber || '',
        birthdate: normalizeBirthdate(user.birthdate),
        age: computedAge !== undefined && computedAge !== null ? computedAge : null,
        gender: user.gender || 'prefer_not_to_say',
        role: user.role,
        addresses: user.addresses || [],
      },
      message: 'Profile fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const existingUser = await User.findById(userId).lean();
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, mobileNumber, phone, age, gender, birthdate, password, addresses } = req.body;
    const errors = {};

    const targetPhone = mobileNumber !== undefined ? mobileNumber : phone;

    // Validate name if provided
    if (name !== undefined && name !== null && !name.trim()) {
      errors.name = 'Name cannot be empty';
    }

    // Validate email if changed
    if (email !== undefined && email !== null && email.trim() !== '') {
      const emailLower = email.trim().toLowerCase();
      if (emailLower !== existingUser.email) {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(emailLower)) {
          errors.email = 'Please provide a valid email address';
        } else {
          const emailExists = await User.findOne({ email: emailLower, _id: { $ne: userId } });
          if (emailExists) {
            errors.email = 'Email address is already registered';
          }
        }
      }
    }

    // Validate mobileNumber / phone if provided
    if (targetPhone !== undefined && targetPhone !== null && targetPhone.trim() !== '') {
      const cleanMobile = targetPhone.trim();
      const mobileRegex = /^\d{10}$/;
      if (!mobileRegex.test(cleanMobile)) {
        errors.mobileNumber = 'Mobile number must be a 10-digit phone number';
      }
    }

    // Validate birthdate & compute age automatically
    let computedAge = age;
    if (birthdate !== undefined && birthdate !== null && birthdate !== '') {
      const dob = new Date(birthdate);
      const today = new Date();
      if (isNaN(dob.getTime())) {
        errors.birthdate = 'Please provide a valid birthdate';
      } else if (dob > today) {
        errors.birthdate = 'Birthdate cannot be in the future';
      } else {
        let calc = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          calc--;
        }
        if (calc < 13 || calc > 100) {
          errors.birthdate = 'Age must be between 13 and 100 years';
        } else {
          computedAge = calc;
        }
      }
    } else if (age !== undefined && age !== null && age !== '') {
      const parsedAge = Number(age);
      if (isNaN(parsedAge) || !Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 100) {
        errors.age = 'Age must be an integer between 13 and 100';
      } else {
        computedAge = parsedAge;
      }
    }

    // Validate gender if provided
    if (gender !== undefined && gender !== null && gender !== '') {
      const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
      if (!validGenders.includes(gender)) {
        errors.gender = 'Gender must be one of: male, female, other, prefer_not_to_say';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Build atomic update payload
    const updateFields = {};
    if (name !== undefined && name !== null) updateFields.name = name.trim();
    let tokenRefreshed = null;
    if (email !== undefined && email !== null && email.trim() !== '') {
      const emailLower = email.trim().toLowerCase();
      if (emailLower !== existingUser.email) {
        updateFields.email = emailLower;
        tokenRefreshed = generateToken(userId, existingUser.role);
      }
    }
    if (targetPhone !== undefined) updateFields.mobileNumber = targetPhone.trim();
    if (birthdate !== undefined) updateFields.birthdate = birthdate;
    if (computedAge !== undefined) updateFields.age = computedAge === '' || computedAge === null ? null : Number(computedAge);
    if (gender !== undefined) updateFields.gender = gender;
    if (addresses !== undefined) updateFields.addresses = addresses;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: false }
    ).select('_id clerkId name email mobileNumber birthdate age gender addresses role').lean();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        clerkId: updatedUser.clerkId || '',
        name: updatedUser.name,
        email: updatedUser.email,
        mobileNumber: updatedUser.mobileNumber || '',
        phone: updatedUser.mobileNumber || '',
        birthdate: normalizeBirthdate(updatedUser.birthdate),
        age: updatedUser.age !== undefined && updatedUser.age !== null ? updatedUser.age : null,
        gender: updatedUser.gender || 'prefer_not_to_say',
        role: updatedUser.role,
        addresses: updatedUser.addresses || [],
        ...(tokenRefreshed ? { token: tokenRefreshed } : {}),
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/saved-address — Fetch authenticated user's saved addresses (multiple)
exports.getSavedAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('name mobileNumber savedAddress addresses').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const allAddresses = [];

    // Signal 1: Address Book items
    if (user.addresses && Array.isArray(user.addresses) && user.addresses.length > 0) {
      user.addresses.forEach((addr, idx) => {
        if (addr && (addr.line1 || addr.street || addr.city)) {
          const l1 = addr.line1 || addr.street || '';
          const l2 = addr.line2 || '';
          allAddresses.push({
            id: addr.id || `addr_book_${idx}`,
            label: addr.label || 'Address Book',
            fullName: user.name || '',
            mobileNumber: addr.phone || user.mobileNumber || '',
            line1: l1,
            line2: l2,
            street: addr.street || (l2 ? `${l1}, ${l2}` : l1),
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            isDefault: !!addr.isDefault,
            source: addr.label ? `${addr.label}` : 'Address Book',
          });
        }
      });
    }

    // Signal 2: Explicit savedAddress on profile
    if (user.savedAddress && (user.savedAddress.line1 || user.savedAddress.street || user.savedAddress.city)) {
      const l1 = user.savedAddress.line1 || user.savedAddress.street || '';
      const l2 = user.savedAddress.line2 || '';
      const existsInList = allAddresses.some(a => a.line1 === l1 && a.city === user.savedAddress.city);
      if (!existsInList) {
        allAddresses.unshift({
          id: 'saved_profile_addr',
          label: 'Default Saved',
          fullName: user.savedAddress.fullName || user.name || '',
          mobileNumber: user.savedAddress.mobileNumber || user.mobileNumber || '',
          line1: l1,
          line2: l2,
          street: user.savedAddress.street || (l2 ? `${l1}, ${l2}` : l1),
          city: user.savedAddress.city || '',
          state: user.savedAddress.state || '',
          pincode: user.savedAddress.pincode || '',
          isDefault: true,
          source: 'Profile Saved Address',
        });
      }
    }

    // Signal 3: Most recent Orders
    const pastOrders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('shippingAddress')
      .lean();

    pastOrders.forEach((order, idx) => {
      if (order && order.shippingAddress && (order.shippingAddress.line1 || order.shippingAddress.street || order.shippingAddress.city)) {
        const l1 = order.shippingAddress.line1 || order.shippingAddress.street || '';
        const l2 = order.shippingAddress.line2 || '';
        const existsInList = allAddresses.some(a => a.line1 === l1 && a.city === order.shippingAddress.city);
        if (!existsInList) {
          allAddresses.push({
            id: `past_order_${order._id || idx}`,
            label: `Past Order #${idx + 1}`,
            fullName: order.shippingAddress.name || user.name || '',
            mobileNumber: order.shippingAddress.phone || user.mobileNumber || '',
            line1: l1,
            line2: l2,
            street: order.shippingAddress.street || (l2 ? `${l1}, ${l2}` : l1),
            city: order.shippingAddress.city || '',
            state: order.shippingAddress.state || '',
            pincode: order.shippingAddress.pincode || '',
            isDefault: false,
            source: 'Recent Order',
          });
        }
      }
    });

    if (allAddresses.length > 0) {
      return res.json({
        success: true,
        exists: true,
        savedAddress: allAddresses[0],
        addresses: allAddresses,
      });
    }

    return res.json({
      success: true,
      exists: false,
      savedAddress: null,
      addresses: [],
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/auth/saved-address — Upsert authenticated user's saved address
exports.updateSavedAddress = async (req, res, next) => {
  try {
    const { fullName, mobileNumber, line1, line2, street, city, state, pincode } = req.body;

    const l1 = (line1 || street || '').trim();
    const l2 = (line2 || '').trim();

    if (!l1 || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Address Line 1, city, state, and pincode are required.',
      });
    }

    const newSavedAddress = {
      fullName: (fullName || '').trim(),
      mobileNumber: (mobileNumber || '').trim(),
      line1: l1,
      line2: l2,
      street: l2 ? `${l1}, ${l2}` : l1,
      city: (city || '').trim(),
      state: (state || '').trim(),
      pincode: (pincode || '').trim(),
      updatedAt: new Date(),
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { savedAddress: newSavedAddress } },
      { new: true, runValidators: false }
    ).select('savedAddress').lean();

    return res.json({
      success: true,
      message: 'Saved address updated successfully',
      savedAddress: user.savedAddress,
    });
  } catch (error) {
    next(error);
  }
};

