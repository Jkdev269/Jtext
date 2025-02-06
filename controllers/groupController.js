const Group = require('../models/Group');
const User = require('../models/user');

exports.createGroup = async (req, res) => {
  const { name, members } = req.body;
  try {
    const group = new Group({ name, members });
    await group.save();
    res.status(201).json({ message: 'Group created successfully', group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendGroupMessage = async (req, res) => {
  const { groupId, senderUsername, text } = req.body;
  try {
    const group = await Group.findById(groupId);
    const sender = await User.findOne({ username: senderUsername });
    if (!group || !sender) {
      return res.status(404).json({ message: 'Group or sender not found' });
    }
    group.messages.push({ sender: sender._id, text });
    await group.save();
    res.status(200).json({ message: 'Message sent to group', group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
