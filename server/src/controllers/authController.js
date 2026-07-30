const User = require('../models/User');
const jwt = require('jsonwebtoken');

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
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber || '',
        age: user.age || null,
        gender: user.gender || 'prefer_not_to_say',
        role: user.role,
        addresses: user.addresses,
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
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, mobileNumber, age, gender, password, addresses } = req.body;
    const errors = {};

    // Validate name
    if (name !== undefined) {
      if (!name || !name.trim()) {
        errors.name = 'Name cannot be empty';
      }
    }

    // Validate email if changed
    if (email !== undefined && email.trim().toLowerCase() !== user.email) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Please provide a valid email address';
      } else {
        const emailExists = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: user._id } });
        if (emailExists) {
          errors.email = 'Email address is already registered';
        }
      }
    }

    // Validate mobileNumber if provided
    if (mobileNumber !== undefined && mobileNumber !== null && mobileNumber.trim() !== '') {
      const cleanMobile = mobileNumber.trim();
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(cleanMobile)) {
        errors.mobileNumber = 'Mobile number must be a valid 10-digit Indian phone number';
      } else {
        const mobileExists = await User.findOne({ mobileNumber: cleanMobile, _id: { $ne: user._id } });
        if (mobileExists) {
          errors.mobileNumber = 'Unable to update mobile number';
        }
      }
    }

    // Validate age if provided
    if (age !== undefined && age !== null && age !== '') {
      const parsedAge = Number(age);
      if (isNaN(parsedAge) || !Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 100) {
        errors.age = 'Age must be an integer between 13 and 100';
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

    // Apply updates
    if (name !== undefined) user.name = name.trim();
    let tokenRefreshed = null;
    if (email !== undefined && email.trim().toLowerCase() !== user.email) {
      user.email = email.trim().toLowerCase();
      tokenRefreshed = generateToken(user._id, user.role);
    }
    if (mobileNumber !== undefined) user.mobileNumber = mobileNumber.trim();
    if (age !== undefined) user.age = age === '' || age === null ? null : Number(age);
    if (gender !== undefined) user.gender = gender;
    if (addresses !== undefined) user.addresses = addresses;
    if (password) user.password = password;

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobileNumber: updatedUser.mobileNumber || '',
        age: updatedUser.age || null,
        gender: updatedUser.gender || 'prefer_not_to_say',
        role: updatedUser.role,
        addresses: updatedUser.addresses,
        ...(tokenRefreshed ? { token: tokenRefreshed } : {}),
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
