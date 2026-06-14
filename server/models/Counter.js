const mongoose = require('mongoose');

// Atomic sequence counter — used for race-condition-free ID generation
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);
