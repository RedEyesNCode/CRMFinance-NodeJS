const mongoose = require('mongoose');

// Create the Mongoose Schema (only for the 'data' part)
const DataSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, // Store the _id of the associated user
        ref: 'UserData', // Reference the UserData model 
        required: true 
    },
    fullName: { type: String, default: "" },
    customer_name : {type :String, default : ""},
    customer_mobile : {type:String,default : ""},
    customer_penalty : {type:String,default : ""},
    customer_emi_id : {type:String,default : ""},
    customer_loan_id : {type:String, default : ""},

   
    collection_amount: { type: String, default: "" } ,
    collection_location: { type: String, default: "" },
    collection_address: { type: String, default: "" },
    collection_status : {type: String,enum : ['EMPTY','PENDING','APPROVED','REJECTED','DISBURSED'],default : 'PENDING'},

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    generated_emi_bill : {type:String, default : ""}


});

// Create the Mongoose model
const UserApprovedCollection = mongoose.model('User-Approved-Collection', DataSchema); 

module.exports = UserApprovedCollection;
