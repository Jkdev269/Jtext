const User = require('../models/user');
// const crypto = require('crypto');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const transporter = require('../config/nodemailer');
const cookieOptions = {
  httpOnly: true, // Prevent client-side scripts from accessing the cookie
  secure:true,
  sameSite: 'none', // Helps prevent CSRF attacks
  // maxAge: 30 * 24 * 60 * 60 * 1000, // Cookie expiration time in milliseconds (30 day)
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  exports.signup = async (req, res) => {
    const { username, email, password } = req.body;
  
    try {
      let user = await User.findOne({ $or: [{ email }, { username }] });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      user = new User({
        username,
        email,
        password,
      });
  
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
  
      await user.save();
  
      const payload = {
        user: {
          id: user.id,
        },
      };
  
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
      res.cookie('token', token, cookieOptions);
      res.status(201).json({ message: 'Signup successful', user: { username, email } });
      // res.status(201).json({ token });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  };

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Set cookie with token
    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      message: 'Login successful',
      user: {token:token, username: user.username, email: user.email },
    });
    console.log(res.status, res.json);
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).send('Server error');
  }
};



  exports.logout = (req, res) => {
    res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
    res.status(200).json({ message: 'Logged out successfully' });
  };
// Send OTP for password reset
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const resetToken = generateOTP();
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 600000; // 10 minutes
  
      await user.save();
  
      const mailOptions = {
        to: user.email,
        from: process.env.SMTP_USER,
        subject: 'Password Reset',
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #4CAF50;">Password Reset Request</h2>
          <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
          <p><strong>Please use the following OTP to reset your password:</strong> <span style="font-size: 1.2em; color: #D32F2F;">${resetToken}</span></p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <p>Best regards,</p>
          <p><strong>Your Company Team</strong></p>
        </div>
      `,
    };
  
      transporter.sendMail(mailOptions, (error, response) => {
        if (error) {
          console.error('There was an error: ', error);
        } else {
          res.status(200).json({ message: 'OTP sent to email' });
        }
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  };
  

// Reset password
exports.resetPassword = async (req, res) => {
    const { resetToken, newPassword } = req.body;
  
    try {
      const user = await User.findOne({
        resetPasswordToken: resetToken,
        resetPasswordExpires: { $gt: Date.now() },
      });
  
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
  
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
  
      await user.save();
  
      const mailOptions = {
        to: user.email,
        from: process.env.SMTP_USER,
        subject: 'Password Changed Successfully',
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #4CAF50;">Password Changed Successfully</h2>
          <p>Hello <strong>${user.username}</strong>,</p>
          <p>This is a confirmation that the password for your account <strong>${user.email}</strong> has just been changed successfully.</p>
          <p>If you did not request this change, please contact our support immediately.</p>
          <p>Best regards,</p>
          <p><strong>Your Company Team</strong></p>
        </div>
      `,
    };
  
      transporter.sendMail(mailOptions, (error, response) => {
        if (error) {
          console.error('There was an error: ', error);
        } else {
          res.status(200).json({ message: 'Password reset successful, confirmation email sent' });
        }
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  };

  // In your controller file
exports.socialLoginController = async (req, res) => {
  try {
    const { email, username, profileImage } = req.body;
    
    // Check if this user already exists in your database
    let user = await User.findOne({ email });
    
    if (!user) {
      // If user doesn't exist, create a new one
      // We'll generate a random password since they'll never use it
      const randomPassword = Math.random().toString(36).slice(-10) + 
                          Math.random().toString(36).slice(-10);
      
      // Create the user with your existing User model
      user = new User({
        email,
        username,
        password: randomPassword, // You'd hash this normally
        profileImage
      });
      
      await user.save();
    }
    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.cookie('token', token, cookieOptions);
    // At this point, user exists in your database
    // Return user info (and JWT token if you use them)
    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        profileImage: user.profileImage
      },
      // If you use JWT tokens:
      // token: generateJwtToken(user._id)
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
