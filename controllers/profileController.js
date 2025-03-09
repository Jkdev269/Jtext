const User = require('../models/user'); // Import the User model
const fs = require('fs');

// Controller to upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    // Get the user ID from the authenticated user
    const userId = req.user.id;
    
    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    
    // Read the uploaded file as binary data
    const imageData = fs.readFileSync(req.file.path);
    // Convert binary data to base64 string
    const base64Image = imageData.toString('base64');
    // Create a data URL that can be stored in the database
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;
    
    // Update the profile image in the database
    user.profileImage = imageUrl;
    await user.save();
    
    // Remove the temporary file from the local storage
    fs.unlinkSync(req.file.path);
    
    res.status(200).json({
      message: 'Profile image updated successfully.',
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ message: 'Failed to upload profile image.' });
  }
};

const getUserProfile = async (req, res) => {
  try {
    // Assuming user ID is available from authentication middleware
    const userId = req.user.id;
    
    // Fetch user details from the database
    const user = await User.findById(userId)
      .select('-password')
      .populate({
        path: "friendRequests.from",
        select: "username profileImage"
      }); 
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const defaultProfileImage = "https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-Image.png";
    
    res.status(200).json({
      username: user.username,
      name: user.username,
      email: user.email,
      _id: user._id,
      profileImage: user.profileImage || defaultProfileImage,
      createdAt: user.createdAt,
      friends: user.friends.map(friend => ({
        _id: friend._id,
        id: friend._id,
        username: friend.username,
        profileImage: friend.profileImage || defaultProfileImage,
      })),
      friendRequests: user.friendRequests.map((req) => ({
        id: req._id,
        senderName: req.from?.username || "Unknown User",
        senderUsername: req.from?.username || "unknown",
        senderProfileImage: req.from?.profileImage || defaultProfileImage,
      })),
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { uploadProfileImage, getUserProfile };