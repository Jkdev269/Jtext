const socketio = require('socket.io');
const Message = require('../models/Message');
const User = require('../models/user');

// Store active users and their socket IDs
const users = {};

const socketHandler = (server) => {
  const io = socketio(server, {
    cors: {
      origin: 'http://jtext-me.s3-website.eu-north-1.amazonaws.com', // Allow requests from your React frontend
      methods: ['GET', 'POST'],
      credentials: true, // Allow cookies and credentials if needed
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Map user to their socket ID when they come online
    socket.on('userOnline', (username) => {
      users[username] = socket.id;
      console.log(`${username} is online. Socket ID: ${socket.id}`);
      console.log('Current online users:', users);
    });

    // Remove user from the active user list when disconnected
    socket.on('disconnect', () => {
      for (const username in users) {
        if (users[username] === socket.id) {
          delete users[username];
          console.log(`${username} is offline.`);
          break;
        }
      }
      console.log('Client disconnected:', socket.id);
    });

    // Handle sending private messages
    socket.on('privateMessage', async (message) => {
      const { senderUsername, receiverUsername, text } = message;

      console.log(`Received private message from ${senderUsername} to ${receiverUsername}: ${text}`);

      // Find the receiver's socket ID
      const receiverSocketId = users[receiverUsername];
      if (receiverSocketId) {
        // Deliver message to the receiver in real time
        io.to(receiverSocketId).emit('privateMessage', {
          senderUsername,
          text,
          timestamp: new Date(),
        });
        console.log(`Message delivered to ${receiverUsername}`);
      } else {
        console.log(`${receiverUsername} is offline. Message will be stored.`);
      }

      // Save the message to the database
      try {
        const sender = await User.findOne({ username: senderUsername });
        const receiver = await User.findOne({ username: receiverUsername });

        if (sender && receiver) {
          const newMessage = new Message({
            sender: sender._id,
            receiver: receiver._id,
            text,
          });
          await newMessage.save();
          console.log('Message saved to the database.');
        } else {
          console.error('Sender or receiver not found in the database.');
        }
      } catch (error) {
        console.error('Error saving message to the database:', error.message);
      }
    });
  });
};

module.exports = socketHandler;
