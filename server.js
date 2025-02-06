const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const http = require('http');
const socketHandler = require('./utils/socket');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const groupRoutes = require('./routes/groupRoutes');
const profileRoutes = require('./routes/profileRoutes');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Use CORS middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow your frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  credentials: true, // Allow cookies if needed
}));
app.use(cookieParser());

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to the database
connectDB();

// Route definitions
app.use('/api/auth', authRouter);
app.use('/api', userRouter);
app.use('/api/private-messages', messageRoutes);
app.use('/api/group-messages', groupRoutes);
// Use profile routes
app.use('/api/user', profileRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.send('Frontend page');
});

// Create an HTTP server
const server = http.createServer(app);

// Initialize the WebSocket server
const io = socketHandler(server);

// Start the HTTP server
server.listen(8081, () => {
  console.log('Server is running on http://localhost:8080');
});
