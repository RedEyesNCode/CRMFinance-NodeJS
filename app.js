var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors"); // Import the cors middleware

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
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

// routes
app.post('/create-user', registerUser);
app.post('/login-user',loginUser);
app.post('/update-mpass',updateMpass);
app.post('/create-lead',createLead);
app.post('/create-visit',user.createVisit)
app.post('/update-lead-status',updateLeadStatus);
app.get('/get-all-leads',getAllLeads)
app.get('/get-all-users',getAllUsers);
app.get('/get-all-visits',user.getAllVisits);
app.post('/delete-user',deleteUser);
app.post('/delete-visit',deleteVisit);
app.post('/delete-lead',deleteLead);
app.post('/get-user-leads',getAllUserLeads);
app.post('/get-user-visit',getAllUserVisits);
app.post('/create-attendance',user.createAttendance);
app.post('/delete-attendance',user.deleteAttendance);
app.post('/get-user-attendance',user.getUserAttendance);
app.get('/get-all-attendance',user.getAllAttendance);




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