var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors"); // Import the cors middleware

var app = express();

// view engine setup
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "ejs");
app.set('view engine', 'ejs'); // Replace 'pug' with your engine
app.set('views', path.join(__dirname, 'views')); // Set views directory
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

require("./models/db");
var user = require("./controllers/user_controller");
app.use(express.json());
const { registerUser,loginUser,updateMpass,createLead,getAllUserLeads,getAllUserVisits,updateLeadStatus,getAllLeads,getAllUsers,deleteLead,deleteUser,deleteVisit } = require('./controllers/user_controller');
const { create } = require("./models/user_model");
const uploadMiddleWare = require("./aws/FileUpload");

// routes
app.post('/create-user', registerUser);
app.post('/update-user',user.updateUser);

app.post('/login-user',loginUser);
app.post('/update-mpass',updateMpass);
app.post('/create-lead',createLead);
app.post('/create-visit',user.createVisit)
app.post('/update-lead-status',updateLeadStatus);
app.post('/get-all-leads',getAllLeads);

/////////////////////////////////Rishi///////////////////////
app.post('/filter-leads-Date_Status_Name',user.getLeadsByDateAndStatusName);//Rishi
app.post('/filter-leads-by-month',user.getLeadsByCurrentMonth);//Rishi
app.post('/filter-approveLoan-by-date',user.getApproveLeadByDate);//Rishi
app.post('/filter-approveLoan-by-month',user.getApproveLeadsByMonth);//Rishi
app.post('/filter-disburseLoan-by-date',user.getDisburseLeadByDate);//Rishi
app.post('/filter-disburseLoan-by-month',user.getDisburseLeadsByMonth);//Rishi
app.post('/filter-rejectedLoan-by-date',user.getRejectedLeadByDate);//Rishi
app.post('/filter-rejectedLoan-by-month',user.getRejectedLeadsByMonth);//Rishi
app.post('/filter-ongoingLoan-by-date',user.getOngoingLeadByDate);//Rishi
app.post('/filter-ongoingLoan-by-month',user.getOngoingLeadsByMonth);//Rishi
app.post('/filter-closedLoan-by-date',user.getclosedLeadByDate);//Rishi
app.post('/filter-closedLoan-by-month',user.getClosedLeadsByMonth);//Rishi


app.post('/create-user-collection',user.createUserCollection);
app.post('/get-user-collection',user.getUserCollection);
app.get('/get-users-with-collection',user.getAllUserTotalAmount);
app.post('/update-user-collection',user.updateUserCollection);
app.post('/delete-user-collection',user.deleteUserCollection);


app.get('/get-admin-dashboard',user.getAdminDashboard);



app.post('/create-lead-card',user.createLeadCard);
app.post('/delete-lead-card',user.deleteLeadCard);
app.get('/get-all-lead-card',user.getAllLeadCards);



app.post('/get-lead-details',user.getLeadDetails);

app.get('/get-all-users',getAllUsers);
app.get('/get-all-visits',user.getAllVisits);
app.post('/update-emp-lead',user.updateEmpLead);


app.post('/delete-user',deleteUser);
app.post('/delete-visit',deleteVisit);
app.post('/delete-lead',deleteLead);
app.post('/get-user-leads',getAllUserLeads);
app.post('/search-user-lead-by-name',user.searchUserLeads);
app.post('/search-user-lead-by-date-status',user.searchUserLeadsByStatus)
app.post('/get-user-approved-leads',user.getAllUserApprovedLeads);

app.post('/check-unique-lead',user.checkUniqueLead);

app.post('/get-user-visit',getAllUserVisits);

app.post('/create-attendance',user.createAttendance);
app.post('/delete-attendance',user.deleteAttendance);
app.post('/get-user-attendance',user.getUserAttendance);
app.get('/get-all-attendance',user.getAllAttendance);
app.post('/upload-file',uploadMiddleWare.single('file'),user.uploadFile);
app.post('/upload-lead-pdf',uploadMiddleWare.single('cibil_pdf'),user.uploadLeadCibilPdf);

app.post('/get-lead-emi',user.getLeadEmi);

// extra modules & tables.
app.get('/get-all-approval-loans',user.getAllApprovalLoans);
app.post('/delete-approval-loan',user.deleteApprovalLoan);
app.post('/update-approval-loan-status',user.updateLoanApprovalStatus);

app.post('/update-amount-fields',user.updateAmountFields);

app.post('/get-approval-loan-detail',user.getLoanApprovalDetails);

app.get('/get-all-disburse-loans',user.getAllDisburmentLoans);
app.post('/get-disbursal-loan-detail',user.getDisbursalLoanDetail);
app.post('/delete-disbursal-loan',user.deleteDisbursalLoan);
app.post('/update-disbursal-loan-status',user.updateDisbursalLoanStatus);


app.post('/delete-ongoing-loan',user.deleteOnGoingLoan);
app.get('/get-all-ongoing-loans',user.getAllOnGoingLoans);
app.post('/close-ongoing-loan',user.closeOnGoingLoan);
app.post('/get-ongoing-loan-detail',user.getOngoingLoanDetail);
app.post('/get-ongoing-emi-detail',user.ongoingEmiDetail);
app.post('/get-emi-amount-detail',user.calculateTotals);

 

//rejected-loans
app.get('/get-all-rejected-loans',user.getAllRejectedLoans);
app.post('/delete-rejected-loan',user.deleteRejectedLoan);
app.post('/get-reject-detail',user.getRejectedDetails);


//closed-loans
app.get('/get-all-closed-loans',user.getAllClosedLoan);
app.post('/delete-closed-loan',user.deleteClosedLoan);
app.get('/get-closed-detail',user.getClosedLoanDetails);




app.get('/get-recycle-bin',user.getAllRecycleBins);


//Update by rishi
app.post('/update-emi-status',user.updateEmiPayment);




app.use(function (req, res, next) {
    next(createError(404));
  });
  
  // error handler
  app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render("error");
  });
  
  module.exports = app;