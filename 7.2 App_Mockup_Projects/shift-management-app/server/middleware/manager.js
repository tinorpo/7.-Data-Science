const User = require('../models/User');

module.exports = async function(req, res, next) {
  try {
    const user = await User.findById(req.user.id);

    // Check if user exists and is a manager or admin
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return res.status(403).json({ msg: 'Access denied. Manager privileges required.' });
    }

    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
