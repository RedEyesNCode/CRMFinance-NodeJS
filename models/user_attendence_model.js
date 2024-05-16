// user_model.js

const mongoose = require('mongoose');

// Create the Mongoose Schema (only for the 'data' part)
const DataSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, // Store the _id of the associated user
        ref: 'UserData', // Reference the UserData model 
        required: true 
    },
    photo: { type: String, default: "" },
    address: { type: String, default: "" },
    status: { type: String, default: "" },
    remark: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Create the Mongoose model
const UserData = mongoose.model('UserAttendance', DataSchema); 

module.exports = UserData;
