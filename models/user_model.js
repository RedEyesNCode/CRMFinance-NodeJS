// user_model.js

const mongoose = require('mongoose');

// Create the Mongoose Schema (only for the 'data' part)
const DataSchema = new mongoose.Schema({

    fullName: { type: String, default: "" },
    telephoneNumber: { type: String, default: "" },
    employeeId: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    mpass: { type: String, default: "" },
    totalCollectionAmount : {type:String, default : "0"} 
});

// Create the Mongoose model
const UserData = mongoose.model('UserData', DataSchema); 

module.exports = UserData;
