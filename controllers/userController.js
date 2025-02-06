const { Server } = require('socket.io');
const User=require('../models/user');
const { request } = require('express');

exports.searchUsers = async (req, res) => {
    const { username } = req.query;
  
    try {
      const users = await User.find({
        username: { $regex: username, $options: 'i' },
      }).select('username email');

      res.status(200).json(users);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  };

  exports.sendRequest = async (req, res) => {
    const { fromUsername, toUsername } = req.body;
  
    try {
      const fromUser = await User.findOne({ username: fromUsername });
      const toUser = await User.findOne({ username: toUsername });
  
      if (!fromUser || !toUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Check if a pending friend request already exists
      const existingRequest = toUser.friendRequests.find(
        (request) => request.from.toString() === fromUser._id.toString() && request.status === 'pending'
      );
  
      if (existingRequest) {
        return res.status(400).json({ message: 'Friend request already sent' });
      }
  
      // Check if they are already friends
      if (toUser.friends && toUser.friends.includes(fromUser._id)) {
        return res.status(400).json({ message: 'You are already friends' });
      }
  
      // Add a new friend request
      toUser.friendRequests.push({ from: fromUser._id });
      await toUser.save();
  
      res.status(200).json({ message: 'Friend request sent' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  };
  
  exports.acceptRequest = async (req, res) => {
    const { fromUsername, toUsername } = req.body;
  
    try {
      const fromUser = await User.findOne({ username: fromUsername });
      const toUser = await User.findOne({ username: toUsername });
  
      if (!fromUser || !toUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Find the pending friend request
      const requestIndex = toUser.friendRequests.findIndex(
        (req) => req.from.toString() === fromUser._id.toString() && req.status === 'pending'
      );
  
      if (requestIndex === -1) {
        return res.status(404).json({ message: "Friend request not found or already processed" });
      }
  
      // Remove the request from friendRequests array
      toUser.friendRequests.splice(requestIndex, 1);
  
      // Add each user to the other's friends list
      if (!toUser.friends.includes(fromUser._id)) {
        toUser.friends.push(fromUser._id);
      }
      if (!fromUser.friends.includes(toUser._id)) {
        fromUser.friends.push(toUser._id);
      }
  
      // Save both users
      await toUser.save();
      await fromUser.save();
  
      res.status(200).json({ message: 'Friend request accepted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  };
  
  exports.rejectRequest = async (req, res) => {
    const { fromUsername, toUsername } = req.body;
  
    try {
      // Find the user who is rejecting the request (the recipient)
      const toUser = await User.findOne({ username: toUsername });
  
      if (!toUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Find the user who is sending the request (the sender)
      const fromUser = await User.findOne({ username: fromUsername });
  
      if (!fromUser) {
        return res.status(404).json({ message: 'Sender user not found' });
      }
  
      // Log the friendRequests array before trying to reject
      console.log("Friend Requests before rejection:", toUser.friendRequests);
  
      // Find the pending request from the specified sender (by comparing ObjectId)
      const requestIndex = toUser.friendRequests.findIndex(
        (request) => request.from.toString() === fromUser._id.toString() && request.status === 'pending'
      );
  
      console.log("Request index:", requestIndex);
  
      // If request is not found, return an error
      if (requestIndex === -1) {
        return res.status(404).json({ message: 'Friend request not found or already processed' });
      }
  
      // Remove the rejected friend request
      toUser.friendRequests.splice(requestIndex, 1);
      await toUser.save();
  
      console.log("Friend Requests after rejection:", toUser.friendRequests);  // Log to verify rejection
  
      res.status(200).json({ message: 'Friend request rejected and removed' });
    } catch (error) {
      console.error("Error during rejection:", error);
      res.status(500).send('Server error');
    }
  };
  
exports.listFriends = async (req, res) => {
    const { username } = req.params;
  
    try {
      const user = await User.findOne({ username }).populate('friends', 'username email');
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json(user.friends);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  };

  