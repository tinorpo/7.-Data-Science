const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const User = require('../models/User');
const auth = require('../middleware/auth');
const manager = require('../middleware/manager');

// @route   GET /api/shifts
// @desc    Get all shifts
// @access  Private/Manager
router.get('/', auth, manager, async (req, res) => {
  try {
    const shifts = await Shift.find()
      .populate('user', ['name', 'email', 'department', 'role'])
      .sort({ startTime: 1 });
    res.json(shifts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/shifts/me
// @desc    Get current user's shifts
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const shifts = await Shift.find({ user: req.user.id })
      .sort({ startTime: 1 });
    res.json(shifts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/shifts/department/:department
// @desc    Get shifts by department
// @access  Private/Manager
router.get('/department/:department', auth, manager, async (req, res) => {
  try {
    // Find users in the department
    const users = await User.find({ department: req.params.department });
    const userIds = users.map(user => user._id);
    
    // Find shifts for these users
    const shifts = await Shift.find({ user: { $in: userIds } })
      .populate('user', ['name', 'email', 'department', 'role'])
      .sort({ startTime: 1 });
    
    res.json(shifts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/shifts/:id
// @desc    Get shift by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id)
      .populate('user', ['name', 'email', 'department', 'role']);
    
    if (!shift) {
      return res.status(404).json({ msg: 'Shift not found' });
    }
    
    // Check if user is authorized to view this shift
    if (shift.user._id.toString() !== req.user.id && req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to view this shift' });
    }
    
    res.json(shift);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shift not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/shifts
// @desc    Create a shift
// @access  Private/Manager
router.post('/', auth, manager, async (req, res) => {
  try {
    const { user, startTime, endTime, notes } = req.body;
    
    // Check if user exists
    const userExists = await User.findById(user);
    if (!userExists) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Create new shift
    const newShift = new Shift({
      user,
      startTime,
      endTime,
      notes
    });
    
    const shift = await newShift.save();
    
    res.json(shift);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/shifts/:id
// @desc    Update a shift
// @access  Private/Manager
router.put('/:id', auth, manager, async (req, res) => {
  try {
    const { startTime, endTime, status, notes } = req.body;
    
    // Build shift object
    const shiftFields = {};
    if (startTime) shiftFields.startTime = startTime;
    if (endTime) shiftFields.endTime = endTime;
    if (status) shiftFields.status = status;
    if (notes) shiftFields.notes = notes;
    
    let shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ msg: 'Shift not found' });
    }
    
    shift = await Shift.findByIdAndUpdate(
      req.params.id,
      { $set: shiftFields },
      { new: true }
    );
    
    res.json(shift);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shift not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/shifts/:id
// @desc    Delete a shift
// @access  Private/Manager
router.delete('/:id', auth, manager, async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({ msg: 'Shift not found' });
    }
    
    await shift.remove();
    
    res.json({ msg: 'Shift removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shift not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
