const mongoose = require('mongoose');
const User=require('../models/user')

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: {
    type: String,
    required: function() {
        return !this.imageUrl;
    }
},
  imageUrl: {
    type: String,
    required: function() {
        // Image is only required if there's no text
        return !this.text;
    }
},
  // type: { type: String, enum: ['text', 'image'], default: 'text' },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent', 'received','seen'], default: 'sent' },
});

module.exports = mongoose.model('Message', MessageSchema);