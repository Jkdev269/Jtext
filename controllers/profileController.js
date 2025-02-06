const User = require('../models/user'); // Import the User model

// Controller to upload profile image
const uploadProfileImage = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Update the profile image URL
    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      message: 'Profile image updated successfully.',
      profileImage: user.profileImage,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload profile image.' });
  }
};



const getUserProfile = async (req, res) => {
  try {
    // Assuming user ID is available from authentication middleware
    const userId = req.user.id;

    // Fetch user details from the database
    const user = await User.findById(userId).select('-password'); // Exclude the password field

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      name: user.username,
      email: user.email,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



module.exports = { uploadProfileImage ,getUserProfile};
