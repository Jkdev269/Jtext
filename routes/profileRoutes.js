const express = require('express');
const multer = require('multer');
const User = require('../models/user'); 
const authenticateUser = require('../middleware/authenticateUser');
const {getUserProfile } = require('../controllers/profileController'); // Import controller
const router = express.Router();
// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to store uploaded images
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Route to upload profile image
router.post('/upload-profile', authenticateUser, upload.single('profileImage'), async (req, res) => {
  try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }

      if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded.' });
      }

      const profileImageURL = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;  // ✅ Fixed URL
      user.profileImage = profileImageURL;
      await user.save();

      res.status(200).json({
          message: 'Profile image updated successfully.',
          profileImage: profileImageURL,
      });
  } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: 'Failed to upload profile image.', error: error.message });
  }
});

router.get('/profile', authenticateUser, getUserProfile);

module.exports = router;
