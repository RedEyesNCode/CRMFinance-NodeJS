// user_lead_model.js

const mongoose = require('mongoose');

const loanApproveModel = new mongoose.Schema({
    // Reference to the parent UserData document
    user: {
        type: mongoose.Schema.Types.ObjectId, // Store the _id of the associated user
        ref: 'UserData', // Reference the UserData model 
        required: true ,
    },
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
    lead_status : {type: String,enum : ['EMPTY','PENDING','APPROVED','REJECTED','DISBURSED','ONGOING'],default : 'PENDING'},

    dateOfBirth: { 
        type:String,
        default : ""
    },
    gender: { type: String, default: "" },
    pincode: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    disbursementDate: { type: String, default : "" },
    updatedAt: { type: Date, default: Date.now },

    // more fields as per the table.

    is_emi_generated : {
        type : Boolean,
        default : false
    },
    is_disbursement_done : {
        type : Boolean,
        default : false
    },
    employee_lead_id_linker : {
        type:String,
        default : 'LEAD-ID-FROM-EMP-APP'
    }

});

const LoanDisburseModel = mongoose.model('LoanDisburseModel', loanApproveModel);

module.exports = LoanDisburseModel;
