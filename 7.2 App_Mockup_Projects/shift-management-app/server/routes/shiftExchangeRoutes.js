const express = require('express');
const router = express.Router();
const ShiftExchange = require('../models/ShiftExchange');
const Shift = require('../models/Shift');
const User = require('../models/User');
const auth = require('../middleware/auth');
const manager = require('../middleware/manager');

// @route   GET /api/shift-exchanges
// @desc    Get all shift exchanges
// @access  Private/Manager
router.get('/', auth, manager, async (req, res) => {
  try {
    const shiftExchanges = await ShiftExchange.find()
      .populate('requestingUser', ['name', 'email', 'department', 'role'])
      .populate('requestedUser', ['name', 'email', 'department', 'role'])
      .populate('requestingShift')
      .populate('requestedShift')
      .populate('approvedBy', ['name', 'email'])
      .sort({ createdAt: -1 });
    res.json(shiftExchanges);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/shift-exchanges/me
// @desc    Get current user's shift exchanges
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const shiftExchanges = await ShiftExchange.find({
      $or: [
        { requestingUser: req.user.id },
        { requestedUser: req.user.id }
      ]
    })
      .populate('requestingUser', ['name', 'email', 'department', 'role'])
      .populate('requestedUser', ['name', 'email', 'department', 'role'])
      .populate('requestingShift')
      .populate('requestedShift')
      .populate('approvedBy', ['name', 'email'])
      .sort({ createdAt: -1 });
    res.json(shiftExchanges);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/shift-exchanges/pending
// @desc    Get pending shift exchanges
// @access  Private/Manager
router.get('/pending', auth, manager, async (req, res) => {
  try {
    const shiftExchanges = await ShiftExchange.find({ status: 'pending' })
      .populate('requestingUser', ['name', 'email', 'department', 'role'])
      .populate('requestedUser', ['name', 'email', 'department', 'role'])
      .populate('requestingShift')
      .populate('requestedShift')
      .sort({ createdAt: -1 });
    res.json(shiftExchanges);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/shift-exchanges/:id
// @desc    Get shift exchange by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const shiftExchange = await ShiftExchange.findById(req.params.id)
      .populate('requestingUser', ['name', 'email', 'department', 'role'])
      .populate('requestedUser', ['name', 'email', 'department', 'role'])
      .populate('requestingShift')
      .populate('requestedShift')
      .populate('approvedBy', ['name', 'email']);
    
    if (!shiftExchange) {
      return res.status(404).json({ msg: 'Shift exchange not found' });
    }
    
    // Check if user is authorized to view this shift exchange
    if (
      shiftExchange.requestingUser._id.toString() !== req.user.id &&
      shiftExchange.requestedUser._id.toString() !== req.user.id &&
      req.user.role !== 'manager' &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ msg: 'Not authorized to view this shift exchange' });
    }
    
    res.json(shiftExchange);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shift exchange not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/shift-exchanges
// @desc    Create a shift exchange request
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { requestedUser, requestingShift, requestedShift, reason } = req.body;
    
    // Validate shifts
    const reqShift = await Shift.findById(requestingShift).populate('user');
    const reqstedShift = await Shift.findById(requestedShift).populate('user');
    
    if (!reqShift || !reqstedShift) {
      return res.status(404).json({ msg: 'One or both shifts not found' });
    }
    
    // Check if requesting user owns the requesting shift
    if (reqShift.user._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'You can only request exchanges for your own shifts' });
    }
    
    // Check if requested user owns the requested shift
    if (reqstedShift.user._id.toString() !== requestedUser) {
      return res.status(403).json({ msg: 'The requested shift does not belong to the requested user' });
    }
    
    // Check if shifts are in the future
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    if (new Date(reqShift.startTime) < twentyFourHoursFromNow || new Date(reqstedShift.startTime) < twentyFourHoursFromNow) {
      return res.status(400).json({ msg: 'Cannot exchange shifts that are less than 24 hours away' });
    }
    
    // Check if users have the same role
    const requestingUser = await User.findById(req.user.id);
    const requestedUserObj = await User.findById(requestedUser);
    
    if (!requestedUserObj) {
      return res.status(404).json({ msg: 'Requested user not found' });
    }
    
    if (requestingUser.role !== requestedUserObj.role) {
      return res.status(400).json({ msg: 'Can only exchange shifts with colleagues of the same role' });
    }
    
    // Create new shift exchange
    const newShiftExchange = new ShiftExchange({
      requestingUser: req.user.id,
      requestedUser,
      requestingShift,
      requestedShift,
      reason
    });
    
    const shiftExchange = await newShiftExchange.save();
    
    res.json(shiftExchange);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/shift-exchanges/:id/approve
// @desc    Approve a shift exchange
// @access  Private/Manager
router.put('/:id/approve', auth, manager, async (req, res) => {
  try {
    const { responseReason } = req.body;
    
    const shiftExchange = await ShiftExchange.findById(req.params.id);
    
    if (!shiftExchange) {
      return res.status(404).json({ msg: 'Shift exchange not found' });
    }
    
    if (shiftExchange.status !== 'pending') {
      return res.status(400).json({ msg: 'This shift exchange has already been processed' });
    }
    
    // Update shift exchange
    shiftExchange.status = 'approved';
    shiftExchange.approvedBy = req.user.id;
    shiftExchange.responseReason = responseReason || 'Approved by manager';
    
    await shiftExchange.save();
    
    // Swap shifts
    const requestingShift = await Shift.findById(shiftExchange.requestingShift);
    const requestedShift = await Shift.findById(shiftExchange.requestedShift);
    
    const tempUser = requestingShift.user;
    requestingShift.user = requestedShift.user;
    requestedShift.user = tempUser;
    
    await requestingShift.save();
    await requestedShift.save();
    
    res.json(shiftExchange);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shift exchange not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/shift-exchanges/:id/reject
// @desc    Reject a shift exchange
// @access  Private/Manager
router.put('/:id/reject', auth, manager, async (req, res) => {
  try {
    const { responseReason } = req.body;
    
    const shiftExchange = await ShiftExchange.findById(req.params.id);
    
    if (!shiftExchange) {
      return res.status(404).json({ msg: 'Shift exchange not found' });
    }
    
    if (shiftExchange.status !== 'pending') {
      return res.status(400).json({ msg: 'This shift exchange has already been processed' });
    }
    
    // Update shift exchange
    shiftExchange.status = 'rejected';
    shiftExchange.approvedBy = req.user.id;
    shiftExchange.responseReason = responseReason || 'Rejected by manager';
    
    await shiftExchange.save();
    
    res.json(shiftExchange);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shift exchange not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/shift-exchanges/:id
// @desc    Delete a shift exchange
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const shiftExchange = await ShiftExchange.findById(req.params.id);
    
    if (!shiftExchange) {
      return res.status(404).json({ msg: 'Shift exchange not found' });
    }
    
    // Check if user is authorized to delete this shift exchange
    if (shiftExchange.requestingUser.toString() !== req.user.id && req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete this shift exchange' });
    }
    
    // Only allow deletion if status is pending
    if (shiftExchange.status !== 'pending' && req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(400).json({ msg: 'Cannot delete a processed shift exchange' });
    }
    
    await shiftExchange.remove();
    
    res.json({ msg: 'Shift exchange removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Shift exchange not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
