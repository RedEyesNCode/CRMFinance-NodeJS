// user_lead_model.js

const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    _id: String, 
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', CounterSchema);

const UserLeadSchema = new mongoose.Schema({
    // Reference to the parent UserData document
    user: {
        type: mongoose.Schema.Types.ObjectId, // Store the _id of the associated user
        ref: 'UserData', // Reference the UserData model 
        required: true ,
    },
    seq: { type: Number, default: 0 },

    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    middleName: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    pincode: { type: String, default: "" },

    gs_loan_number: { type: String, default: "" },
    gs_loan_password: { type: String, default: "" },
    gs_loan_userid: { type: String, default: "" },

    userType : {type :String,default : ""},
    monthlySalary : {type:String ,default : ""},
    relativeName: { type: String, default: "" },
    relativeNumber: { type: String, default: "" },
    currentAddress: { type: String, default: "" },
    state: { type: String, default: "" },
    aadhar_front: { type: String, default: "" },
    aadhar_back: { type: String, default: "" },
    pancard: { type: String, default: "" },
    pancard_img: { type: String, default: "" },
    aadhar_card: { type: String, default: "" },

    selfie: { type: String, default: "" },
    additional_document: { type: String, default: "" },
    cibil_pdf: { type: String, default: "" },
    leadAmount: { type: String, default: "" },
    lead_interest_rate: { type: String, default: "" },
    processingFees: { type: String, default: "" },
    feesAmount: { type: String, default: "" },
    customerLoanAmount: { type: String, default: "" },
    empApproveAmount: { type: String, default: "" },
    lead_status : {type: String,enum : ['EMPTY','PENDING','APPROVED','REJECTED','DISBURSED'],default : 'PENDING'},

    dateOfBirth: { 
        type:String,
        default : ""
    },
    gender: { type: String, default: "" },
    pincode: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    disbursementDate: { type: String, default : "" },

    updatedAt: { type: Date, default: Date.now }
});

const UserLead = mongoose.model('UserLead', UserLeadSchema);


UserLeadSchema.pre('save', async function (next) {
    try {
        if (!this.isNew) return next(); // Only generate for new documents

        const sequenceName = 'userLeadId'; // Consistent naming
        const nextSequenceValue = await getNextSequenceValue(sequenceName);

        this.userLeadId = nextSequenceValue;
        next();
    } catch (error) {
        console.error('Error generating userLeadId:', error);
        next(error); // Pass the error to Mongoose
    }
});

async function getNextSequenceValue(sequenceName) {
    const counterDoc = await Counter.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    if (!counterDoc) {
        throw new Error(`Could not get next sequence value for ${sequenceName}`);
    }
    return counterDoc.seq;
}
  
module.exports = UserLead;
