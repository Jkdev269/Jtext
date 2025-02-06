const express=require('express')
const { searchUsers, sendRequest, acceptRequest, listFriends, rejectRequest } = require('../controllers/userController')
const authenticateUser = require('../middleware/authenticateUser');
const router=express.Router()
router.get('/search',authenticateUser,searchUsers)
router.post('/send-request',authenticateUser,sendRequest)
router.post('/accept-request',authenticateUser,acceptRequest)
router.post('/reject-request',authenticateUser,rejectRequest)
router.get('/friends/:username',authenticateUser,listFriends)
module.exports=router;