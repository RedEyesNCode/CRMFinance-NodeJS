// user_model.js

const mongoose = require('mongoose');

// Create the Mongoose Schema (only for the 'data' part)
const DataSchema = new mongoose.Schema({

    telephoneNumber: { type: String, default: "" },
    pancard: { type: String, default: "" },
    aadhar_card: { type: String, default: "" },

    remarks: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Create the Mongoose model
const LeadCardModel = mongoose.model('LeadCardModel', DataSchema); 

module.exports = LeadCardModel;
