const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for shift duration
ShiftSchema.virtual('duration').get(function() {
  return (this.endTime - this.startTime) / (1000 * 60 * 60); // Duration in hours
});

// Ensure virtual fields are included when converting to JSON
ShiftSchema.set('toJSON', { virtuals: true });
ShiftSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Shift', ShiftSchema);
