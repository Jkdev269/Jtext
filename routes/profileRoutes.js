const express = require('express');
const multer = require('multer');
const authenticateUser = require('../middleware/authenticateUser');
const { uploadProfileImage,getUserProfile } = require('../controllers/profileController'); // Import controller
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
router.post('/upload-profile', upload.single('profileImage'),authenticateUser, uploadProfileImage);
router.get('/profile', authenticateUser, getUserProfile);

module.exports = router;
