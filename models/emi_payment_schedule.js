const mongoose = require('mongoose');

const emiPaymentScheduleSchema = new mongoose.Schema({
  loanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LoanOngoingModel', // Reference the 'Loan' model
    required: true 
  },
 
  totalLoanAmount: { type: String, required: false },
  interestRate: { type: String, required: false },
  loanTenureMonths: { type: String, required: false },
  totalInterest : {type:String,required:false},
  monthlyInterest : {type:String,required:false},
  
  startDate: { type: Date, required: false },
  endDate: { type: Date, required: false },
  emiAmount: { type: String, required: false },
  paymentFrequency: { 
    type: String, 
    enum: ['monthly', 'quarterly', 'semi-annually', 'annually'], 
    default: 'monthly' 
  },
  payments: [{
    dueDate: { type: Date, required: false },
    amountDue: { type: String, required: false },
    principalAmount: { type: String, required: false },
    interestAmount: { type: String, required: false },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'paid', 'overdue'], 
      default: 'pending' 
    },
    paymentDate: Date,
    paymentMode: { 
      type: String, 
      enum: ['online', 'cash', 'cheque', 'other'] 
    },
    paymentReference: String
  }]
});

const EmiPaymentSchedule = mongoose.model('EmiPaymentSchedule', emiPaymentScheduleSchema);

module.exports = EmiPaymentSchedule;
