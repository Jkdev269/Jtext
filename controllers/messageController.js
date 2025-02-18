const Message = require('../models/Message');
const User = require('../models/user');

exports.sendMessage = async (req, res) => {
  const { fromUsername, toUsername, text } = req.body;

  try {
      const sender = await User.findOne({ username: fromUsername });
      const receiver = await User.findOne({ username: toUsername });

      if (!sender || !receiver) {
          return res.status(404).json({ message: 'User not found' });
      }

      const message = new Message({ sender: sender._id, receiver: receiver._id, text });
      await message.save();

      // Emit message to Socket.io
      const io = req.app.get('socketio'); // Get io instance
      const receiverIdString = receiver._id.toString();
      // const io = req.app.get("socketio");
if (!io) {
    console.error("Socket.io instance is missing!");
    return res.status(500).json({ error: "Internal server error" });
}

  // Emit to the *receiver's* room
  io.to(receiverIdString).emit('receiveMessage', { 
    sender: sender._id, 
    text: text, // Send the text, not the entire message object
    senderUsername: fromUsername, // Include the sender's username
});
      res.status(200).json({ message: 'Message sent', data: message });
  } catch (error) {
      console.error('Send Message Error:', error);
      res.status(500).json({ error: error.message });
  }
};

exports.getMessages = async (req, res) => {
    const { fromUsername, toUsername } = req.params;
    try {
      const fromUser = await User.findOne({ username: fromUsername });
      const toUser = await User.findOne({ username: toUsername });
  
      if (!fromUser || !toUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const messages = await Message.find({
        $or: [
          { sender: fromUser._id, receiver: toUser._id },
          { sender: toUser._id, receiver: fromUser._id }
        ]
      }).sort({ timestamp: 1 });
  
      res.status(200).json(messages);
    } catch (error) {
      console.error('Get Messages Error:', error);
      res.status(500).json({ error: error.message });
    }
  };
