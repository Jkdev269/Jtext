const express = require('express');
const { createGroup, sendGroupMessage } = require('../controllers/groupController');
const authenticateUser = require('../middleware/authenticateUser');
const router = express.Router();

router.post('/create',authenticateUser, createGroup);
router.post('/send', sendGroupMessage);

module.exports = router;