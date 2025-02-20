const Message = require('../models/Message');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/images';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure multer upload
const upload = multer({
    storage: storage,
    
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}).single('image'); // 'image' is the field name for the image file

exports.sendMessage = async (req, res) => {
    try {
        // Handle image upload first
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: 'Image upload failed', error: err.message });
            }

            const { fromUsername, toUsername, text } = req.body;
            let imageUrl = null;

            // If there's an uploaded file, set the imageUrl
            if (req.file) {
                imageUrl = `/uploads/images/${req.file.filename}`;
                // console.log("🔹 Received Data:", req.body);
                console.log("📸 Uploaded File:", req.file);
            }

            // Find users
            const sender = await User.findOne({ username: fromUsername });
            const receiver = await User.findOne({ username: toUsername });

            if (!sender || !receiver) {
                // Clean up uploaded file if users not found
                if (imageUrl) {
                    fs.unlinkSync(path.join(__dirname, '..', imageUrl));
                }
                return res.status(404).json({ message: 'User not found' });
            }

            // Create and save message
            const message = new Message({
                sender: sender._id,
                receiver: receiver._id,
                text,
                imageUrl,
                type: imageUrl ? 'image' : 'text',
                status: 'sent'
            });

            await message.save();

            // Handle Socket.io emission
            const io = req.app.get('socketio');
            if (!io) {
                console.error("Socket.io instance is missing!");
                return res.status(500).json({ error: "Internal server error" });
            }

            // Emit to receiver's room
            io.to(receiver._id.toString()).emit('receiveMessage', {
                sender: sender._id,
                text,
                imageUrl,
                type: imageUrl ? 'image' : 'text',
                senderUsername: fromUsername,
                _id: message._id,
                createdAt: message.createdAt
            });

            res.status(200).json({ message: 'Message sent', data: message });
        });
    } catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getMessages = async (req, res) => {
    const { fromUsername, toUsername } = req.params;
    try {
        const fromUser = await User.findOne({ username: fromUsername });
        const toUser = await User.findOne({ username: toUsername });

        if (!fromUser || !toUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const messages = await Message.find({
            $or: [
                { sender: fromUser._id, receiver: toUser._id },
                { sender: toUser._id, receiver: fromUser._id }
            ]
        }).sort({ timestamp: 1 });

        // Transform messages to include full image URLs
        const transformedMessages = messages.map(message => ({
            ...message.toObject(),
            imageUrl: message.imageUrl ? `${process.env.BASE_URL}${message.imageUrl}` : null
        }));

        res.status(200).json(transformedMessages);
    } catch (error) {
        console.error('Get Messages Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.markMessageAsSeen = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userId } = req.body;

        console.log("🔍 Incoming request to mark as seen:", { messageId, userId });

        const message = await Message.findById(messageId);
        
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        console.log("💬 Message found:", {
            sender: message.sender.toString(),
            receiver: message.receiver.toString(),
            requestUserId: userId
        });

        if (message.receiver.toString() !== userId) {
            console.log("❌ Unauthorized action: Receiver mismatch", {
                messageReceiver: message.receiver.toString(),
                requestUser: userId
            });
            return res.status(403).json({
                message: "Unauthorized action",
                details: "Only the message receiver can mark it as seen"
            });
        }

        message.status = "seen";
        await message.save();

        const io = req.app.get("socketio");
        io.to(message.sender.toString()).emit("messageSeen", messageId, userId);

        console.log("✅ Message marked as seen and event emitted");

        res.status(200).json({
            message: "Message marked as seen",
            messageId: message._id,
            status: message.status
        });
    } catch (error) {
        console.error("❌ Error marking message as seen:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};