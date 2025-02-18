const { Server } = require('socket.io');
const User=require('../models/user');
const { request } = require('express');

exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.query || ""; // Get search query
    const users = await User.find({
      username: { $regex: query, $options: "i" } // Case-insensitive search
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.sendRequest = async (req, res) => {
  try {
    if (!req.user || !req.user.username) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const fromUsername = req.user.username; // Get from authenticated user
    const { toUsername } = req.body;

    console.log(`Friend request from: ${fromUsername} to ${toUsername}`); // Debugging

    const fromUser = await User.findOne({ username: fromUsername });
    const toUser = await User.findOne({ username: toUsername });

    if (!fromUser || !toUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if request already exists
    const existingRequest = toUser.friendRequests.find(
      (request) => request.from.toString() === fromUser._id.toString() && request.status === "pending"
    );

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Check if already friends
    if (toUser.friends && toUser.friends.includes(fromUser._id)) {
      return res.status(400).json({ message: "You are already friends" });
    }

    // Add friend request
    toUser.friendRequests.push({ from: fromUser._id });
    await toUser.save();

    res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ message: "Server error" });
  }
};

  
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.id; // Get logged-in user ID ✅

    // 1️⃣ Find the user who received the friend request
    const toUser = await User.findById(userId).populate("friendRequests.from");

    if (!toUser) {
      return res.status(404).json({ message: "User not found" }); // ✅ Check if user exists
    }

    // 2️⃣ Find the pending request
    const requestIndex = toUser.friendRequests.findIndex(
      (req) => req._id.toString() === requestId && req.status === "pending"
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Friend request not found or already processed" }); // ✅ Handle missing request
    }

    // 3️⃣ Get sender's ID (Fix sender access)
    const fromUserId = toUser.friendRequests[requestIndex].from._id;

    // 4️⃣ Remove request from `friendRequests` array
    toUser.friendRequests = toUser.friendRequests.filter(req => req._id.toString() !== requestId);

    // 5️⃣ Add each user to the other's friends list
    if (!toUser.friends.includes(fromUserId)) {
      toUser.friends.push(fromUserId);
    }

    // 6️⃣ Update sender's friend list as well
    const fromUser = await User.findById(fromUserId);
    if (!fromUser) {
      return res.status(404).json({ message: "Sender user not found" }); // ✅ Handle missing sender
    }

    if (!fromUser.friends.includes(userId)) {
      fromUser.friends.push(userId);
      await fromUser.save(); // ✅ Save sender's changes
    }

    await toUser.save(); // ✅ Save changes for receiver

    res.status(200).json({ message: "Friend request accepted successfully" }); // ✅ Return success message
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ message: "Server error", error }); // ✅ Return detailed error
  }
};


exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.id; // ✅ Get logged-in user ID

    // 1️⃣ Find the user who received the request
    const toUser = await User.findById(userId).populate("friendRequests.from");

    if (!toUser) {
      return res.status(404).json({ message: "User not found" }); // ✅ Handle user not found
    }

    // 2️⃣ Find the request in `friendRequests`
    const requestIndex = toUser.friendRequests.findIndex(
      (req) => req._id.toString() === requestId && req.status === "pending"
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Friend request not found or already processed" }); // ✅ Handle missing request
    }

    // 3️⃣ Remove request from `friendRequests`
    toUser.friendRequests = toUser.friendRequests.filter(req => req._id.toString() !== requestId);

    await toUser.save(); // ✅ Save changes for receiver

    res.status(200).json({ message: "Friend request rejected successfully" }); // ✅ Return success message
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    res.status(500).json({ message: "Server error", error }); // ✅ Return detailed error
  }
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("friends", "username profileImage");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(
      user.friends.map((friend) => ({
        _id: friend._id || friend.id, 
        id: friend._id,
        username: friend.username,
        profileImage: friend.profileImage || "https://via.placeholder.com/150",
      }))
    );
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ message: "Server error" });
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

  