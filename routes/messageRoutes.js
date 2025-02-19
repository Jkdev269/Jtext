const express = require('express');
const { sendMessage, getMessages,markMessageAsSeen } = require('../controllers/messageController');
const authenticateUser = require('../middleware/authenticateUser');
const router = express.Router();

router.post('/send',authenticateUser,sendMessage);
router.get('/:fromUsername/:toUsername',authenticateUser, getMessages);
router.put('/seen/:messageId',authenticateUser ,markMessageAsSeen); // New route


module.exports = router;

