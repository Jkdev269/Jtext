const mongoose = require('mongoose')
const { type } = require('os')
const UserSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    friendRequests: [
        {
            from: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
            status: {
                type: String,
                enum: ['pending', 'accepted', 'rejected'],
                default: 'pending'
            },
        },
    ],
    friends:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'User'
        },
     ],
     profileImage: { type: String, default: 'https://via.placeholder.com/150' }, // Default profile image
},
{ timestamps: true }
)
module.exports = mongoose.model('User', UserSchema)




