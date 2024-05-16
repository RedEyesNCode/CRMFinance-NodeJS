// user_model.js

const mongoose = require('mongoose');

// Create the Mongoose Schema (only for the 'data' part)
const DataSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, // Store the _id of the associated user
        ref: 'UserData', // Reference the UserData model 
        required: true 
    },
    customerName: { type: String, default: "" },
    address: { type: String, default: "" },
    customerNumber: { type: String, default: "" },
   
    remark: { type: String, default: "" } ,
    photo: { type: String, default: "" } ,
    latitude: { type: String, default: "" },
    longitude: { type: String, default: "" },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Create the Mongoose model
const UserData = mongoose.model('UserVisit', DataSchema); 

module.exports = UserData;
