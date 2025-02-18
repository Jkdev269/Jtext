// authenticateUser middleware
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticateUser =async (req, res, next) => {
  const token = req.cookies.token; // Ensure the token is in the cookies

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id); 
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user; // Attach the user info to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticateUser;
