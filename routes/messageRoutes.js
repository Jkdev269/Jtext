const express = require('express');
const { sendMessage, getMessages } = require('../controllers/messageController');
const authenticateUser = require('../middleware/authenticateUser');
const router = express.Router();

router.post('/send',authenticateUser,sendMessage);
router.get('/:fromUsername/:toUsername',authenticateUser, getMessages);

module.exports = router;

