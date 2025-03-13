const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const groupRoutes = require('./routes/groupRoutes');
const profileRoutes = require('./routes/profileRoutes');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config();
const Port=process.env.PORT;

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true,
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to DB
connectDB();

// Routes
app.get('/', (req, res) => {
    res.send('API is running');
});
app.use('/api/auth', authRouter);
app.use('/api', userRouter);
app.use('/api/private-messages', messageRoutes);
app.use('/api/group-messages', groupRoutes);
app.use('/api/user', profileRoutes);

// WebSocket Connection
app.set("socketio", io);
const onlineUsers = new Set();

io.on('connection', (socket) => {
  // User comes online
  socket.on('userOnline', (userId) => {
    onlineUsers.add(userId);
    io.emit('userOnline', userId);
  });
  
  // User goes offline
  socket.on('userOffline', (userId) => {
    onlineUsers.delete(userId);
    io.emit('userOffline', userId);
  });
  
  // Get all online users
  socket.on('getOnlineUsers', () => {
    socket.emit('onlineUsers', Array.from(onlineUsers));
  });
  
  // Join a room (for private messages)
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });
  
  // Leave a room
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
  });
  
  // Send a message
  socket.on('sendMessage', (message) => {
    // Broadcast to receiver's room
    io.to(message.receiver).emit('receiveMessage', message);
  });
  
  // Message seen notification
  socket.on("messageSeen", (data) => {
    const { messageId, viewerId, senderId } = data;
    // Emit to the original sender so they can update their UI
    io.to(senderId).emit("messageSeen", { messageId, viewerId });
  });
  socket.on("callRequest", (data) => {
    const { calleeId, callerId, callerName } = data;
    
    // Notify the callee about the incoming call
    io.to(calleeId).emit("callRequest", {
        callerId,
        callerName
    });
    
    console.log(`Call request from ${callerId} to ${calleeId}`);
});

socket.on("callAccepted", (data) => {
    const { callerId, calleeId } = data;
    
    // Notify the caller that the call was accepted
    io.to(callerId).emit("callAccepted", calleeId);
    
    console.log(`Call accepted by ${calleeId}`);
});

socket.on("callRejected", (data) => {
    const { callerId, calleeId } = data;
    
    // Notify the caller that the call was rejected
    io.to(callerId).emit("callEnded", calleeId);
    
    console.log(`Call rejected by ${calleeId}`);
});

socket.on("callEnded", (data) => {
    const { receiverId, senderId } = data;
    
    // Notify the receiver that the call has ended
    io.to(receiverId).emit("callEnded", senderId);
    
    console.log(`Call ended by ${senderId}`);
});

socket.on("voiceCallRequest", (data) => {
  const { calleeId, callerId, callerName } = data;
  
  // Emit the voice call request to the recipient
  io.to(calleeId).emit("voiceCallRequest", {
      callerId,
      callerName
  });
  
  console.log(`Voice call request from ${callerId} to ${calleeId}`);
});

socket.on("voiceCallAccepted", (data) => {
  const { callerId, calleeId } = data;
  
  // Notify the caller that the call was accepted
  io.to(callerId).emit("voiceCallAccepted", calleeId);
  
  console.log(`Voice call accepted by ${calleeId}`);
});

socket.on("voiceCallRejected", (data) => {
  const { callerId, calleeId } = data;
  
  // Notify the caller that the call was rejected
  io.to(callerId).emit("voiceCallEnded", calleeId);
  
  console.log(`Voice call rejected by ${calleeId}`);
});

socket.on("voiceCallEnded", (data) => {
  const { senderId, receiverId } = data;
  
  // Notify the other party that the call has ended
  io.to(receiverId).emit("voiceCallEnded", senderId);
  
  console.log(`Voice call ended by ${senderId}`);
});
  // Disconnect
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.userId); // Remove user from onlineUsers
    io.emit('userOffline', socket.userId); // Notify others that the user is offline
  });

});

// Start server
server.listen(Port, () => {
    console.log(`Server is running on ${Port}`);
});
