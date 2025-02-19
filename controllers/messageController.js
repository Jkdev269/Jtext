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
  io.to(receiver._id.toString()).emit('receiveMessage', { 
    sender: sender._id, 
    text: text, // Send the text, not the entire message object
    senderUsername: fromUsername, // Include the sender's username
    _id: message._id, // Include the message _id
    createdAt: message.createdAt // Include the timestamp
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
  exports.markMessageAsSeen = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userId } = req.body;  // Get userId from request body

        console.log("🔍 Incoming request to mark as seen:", { messageId, userId });

        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        console.log("💬 Message found:", {
            sender: message.sender.toString(), 
            receiver: message.receiver.toString(),
            requestUserId: userId
        });

        // Check if the user making the request is the receiver of the message
        if (message.receiver.toString() !== userId) {
            console.log("❌ Unauthorized action: Receiver mismatch", {
                messageReceiver: message.receiver.toString(),
                requestUser: userId
            });
            return res.status(403).json({ 
                message: "Unauthorized action",
                details: "Only the message receiver can mark it as seen"
            });
        }

        message.status = "seen";
        await message.save();

        // Emit event to sender
        const io = req.app.get("socketio");
        io.to(message.sender.toString()).emit("messageSeen", messageId, userId);

        console.log("✅ Message marked as seen and event emitted");

        res.status(200).json({ 
            message: "Message marked as seen",
            messageId: message._id,
            status: message.status
        });
    } catch (error) {
        console.error("❌ Error marking message as seen:", error);
        res.status(500).json({ 
            message: "Internal server error",
            error: error.message 
        });
    }
};

