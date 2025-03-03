const express=require('express')
const {login,signup,forgotPassword,resetPassword,logout,socialLoginController}=require('../controllers/authController')
const authenticateUser = require('../middleware/authenticateUser');
const router=express.Router();
router.post('/signup',signup);
router.post('/login',login);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password/', resetPassword);
router.post('/logout',authenticateUser,logout);
router.post('/social-login', socialLoginController);

module.exports=router;
