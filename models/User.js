const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  referrals: { type: [String], default: [] },
  balance: { type: Number, default: 0 }, // TRX balance
});

module.exports = mongoose.model('User', userSchema);
