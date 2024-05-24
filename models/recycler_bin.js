// recycle_bin.js

const mongoose = require('mongoose');

const recycleBinSchema = new mongoose.Schema({
  json_recycle: {
    type: String, // Flexible for storing JSON data
    required: true 
  },
  json_type: {
    type: String, // Flexible for storing JSON data
    required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set on creation
  },
  updatedAt: {
    type: Date,
    default: Date.now, // Set initially, updated on each save
  }
}, {
  // Automatically manage timestamps (createdAt and updatedAt)
  timestamps: true 
});

// Pre-save hook to update 'updatedAt' before each save operation
recycleBinSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const RecycleBin = mongoose.model('RecycleBin', recycleBinSchema);

module.exports = RecycleBin;
