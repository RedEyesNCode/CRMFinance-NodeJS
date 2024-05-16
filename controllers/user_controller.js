// user_controller.js

const { default: mongoose } = require('mongoose');
const UserLead = require('../models/user_lead_model');
const UserData = require('../models/user_model');
const UserVisit = require('../models/user_visit_model');
const UserAttendance = require('../models/user_attendence_model');

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}
function makeidNumber(length) {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}
//update-mpass
const updateMpass = async (req, res) => {
    try {
        
        const { currentMpass, newMpass,userId } = req.body;

        if (!userId || !currentMpass || !newMpass) {
            return res.status(200).json({status : 'fail',code : 400, error: "Missing userId, currentMpass, or newMpass" });
        }

        const user = await UserData.findById(userId);
        if (!user) {
            return res.status(200).json({ error: "User not found",status : 'fail',code : 400 });
        }

        // Direct string comparison for password verification
        if (currentMpass !== user.mpass) {
            return res.status(200).json({ error: "Incorrect current password",status : 'fail',code : 400 });
        }

        user.mpass = newMpass; // Update the password directly
        await user.save();

        res.status(200).json({ message: "Password updated successfully",status : 'success',code : 200 });

    } catch (error) {
        console.error(error);
        res.status(200).json({ error: "Internal Server Error" });
    }
};
// controller functon to delete-lead
const deleteLead = async (req,res) =>{

    try{
        const {leadId} = req.body;
        const userLead = await UserLead.findByIdAndDelete(leadId);
        if(userLead!=null){

            return res.status(200).json({status : 'success',code : 200,message : 'Lead Deleted successfully !'})
        }else{
            return res.status(200).json({status : 'fail',code : 400,message : 'No lead found !'})

        }

    }catch(error){
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }


}



// controller function to delete-users
const deleteUser = async (req,res) =>{
    try{
        const {userId} = req.body;
        const user = await UserData.findByIdAndDelete(userId);
        if(user!=null){

            return res.status(200).json({status : 'success',code : 200,message : 'Deleted user successfully !'})
        }else{
            return res.status(200).json({status : 'fail',code : 400,message : 'No users found !'})

        }


    }catch(error){
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }


}


// controller function to get-all-users
const getAllUsers = async (req,res) =>{
    try{
        const allUsers = await UserData.find();
        if(allUsers.length==0){
            return res.status(200).json({status : 'fail',code : 400,message : 'No users found !'})
        }else {
            return res.status(200).json({status : 'fail',code : 400,message : 'all-app-users',data : allUsers})
        }


    }catch (error){
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }


}




// controller function to update-lead
const updateLeadStatus = async (req,res) => {

    try{
        const {leadId, status, amount,feesAmount, interestRate} = req.body;

        const userLead = await UserLead.findById(leadId)
        if(userLead.length!=0){
            if(status==="APPROVED"){
                userLead.lead_status = status;
                userLead.leadAmount = amount;
                userLead.feesAmount = feesAmount;
                userLead.processingFees = feesAmount;
                userLead.lead_interest_rate = interestRate;
                userLead.disbursementDate = "";
            }else if(status==="DISBURSED"){
                userLead.disbursementDate(Date.now());
            }

                userLead.lead_status = status;
                await userLead.save();

            res.status(200).json({status : 'success',code : 200,message : 'Lead updated successfully ',data : userLead})

        }else{
            res.status(200).json({status : 'fail',code : 200,error : 'User Lead Not Found !'})

        }

    }catch (error){
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }

}



// controller function to get-all-leads
const getAllLeads = async (req,res) =>{
    try{
        const allLeads = await UserLead.find();
        if(allLeads.length==0){
            res.status(200).json({status : 'fail',code : 200,error : 'No Leads Exists'})
        }else{
            res.status(200).json({status : 'success',code : 200,message : 'all-admin-leads',data : allLeads});
        }

    }catch {
        console.error(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }


}



// controller function to create-lead

const createLead = async (req, res) => {
    try {
        const {leadData, userId,mobileNumber,pancard,aadhar_card} = req.body;  // Get lead data from the request body

        // Check if userId is valid
        const user = await UserData.findById(userId);
        if (!user) {
            return res.status(200).json({code : '200',status : 'fail', error: "User not found" });
        }
        const existingLead = await UserLead.find({mobileNumber : mobileNumber,pancard : pancard,aadhar_card : aadhar_card});
        

        if(existingLead.length!=0){
            return res.status(200).json({code : '200',status : 'fail', error: "Lead Alredy Exists" });

        }


        // Create a new UserLead document
        const newLead = new UserLead(req.body);
        newLead.user = userId;

        // Save the lead to the database
        const savedLead = await newLead.save();

        res.status(201).json({
            status: "200",
            code: 200,
            message: "Lead created successfully!",
            data: savedLead
        });
    } catch (error) {
        console.error(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
};
// controller function to delete-visit
const deleteVisit = async (req,res) => {

    try{
        const {visitId} = req.body;
        const userLead = await UserVisit.findByIdAndDelete(visitId);
        if(userLead!=null){
            return res.status(200).json({status : 'success',code : 200,message : 'Visit Deleted successfully !'})
        }else{
            return res.status(200).json({status : 'fail',code : 400,message : 'No Visit found !'})
        }

    }catch(error){
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const getAllUserLeads = async (req,res) => {

    try{
        
        const userLead = await UserLead.find({user : req.body.userId});
        if(userLead.length!=0){
            return res.status(200).json({status : 'success',code : 200,message : 'User Leads Fetched successfully !',data : userLead})
        }else{
            return res.status(200).json({status : 'fail',code : 400,message : 'No User Leads found !'})
        }
    }catch(error){
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
}
const getAllUserVisits = async (req,res) => {

    try{
        
        const userLead = await UserVisit.find({user : req.body.userId});
        if(userLead.length!=0){
            return res.status(200).json({status : 'success',code : 200,message : 'User Visits Fetched successfully !',data : userLead})
        }else{
            return res.status(200).json({status : 'fail',code : 400,message : 'No User Visits found !'})
        }

    }catch(error){
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
}


const getAllVisits = async (req,res) => {
    try{
        const userLead = await UserVisit.find();
        if(userLead!=null){
            return res.status(200).json({status : 'success',code : 200,message : 'Visit Fetched successfully !',data : userLead})
        }else{
            return res.status(200).json({status : 'fail',code : 400,message : 'No Visit found !'})
        }

    }catch(error){
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }


}



// controller function to get-user-attendance.
const getUserAttendance = async(req,res) => {

    try{
        const {userId} = req.body;
        const userAttendence = await UserAttendance.find({user : userId})
        if(userAttendence.length!=0){
            res.status(200).json({status : 'success',code : 200, message : 'User attendance fetched successfully !',data : userAttendence})

        }else{
            res.status(200).json({ status : 'fail',code : 500,message: "Internal Server Error" });

        }

    }catch(error) {
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,message: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });

    }


}



// controller function to delete-attendance.
const deleteAttendance = async (req,res) => {

    try{
        const {attendanceId} = req.body;
        const userLead = await UserAttendance.findByIdAndDelete(attendanceId);
        if(userLead!=null){
            return res.status(200).json({status : 'success',code : 200,message : 'Attendance Deleted successfully !'})
        }else{
            return res.status(200).json({status : 'fail',code : 400,message : 'No Visit found !'})
        }

    }catch(error){
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }

}

// controller function to get-all-attendance.
const getAllAttendance = async(req,res) => {

    try{
        const allAttendance = await UserAttendance.find();
        if(allAttendance.length!=0){
            return res.status(200).json({ status : 'success',code : 200,message: "All attendance record",data : allAttendance });

        }else{
            return res.status(200).json({ status : 'fail',code : 200,message: "No attendance found" });

        }


    }catch(error){
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });

    }

}



// controller function to create-attendance.
const createAttendance = async (req,res) => {

    try{
        const {userId} = req.body;

        const newAttendance = new UserAttendance(req.body);
        newAttendance.user = userId;

        // Save the lead to the database
        const savedLead = await newAttendance.save();

        return res.status(200).json({ status : 'success',code : 200,message: "Created Attendance successfully",data : savedLead });


    }catch (error){
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });

    }

}


// controller function to create-visit

const createVisit = async (req,res) => {

    try{
        const {userId} = req.body;

        const newVisit = new UserVisit(req.body);
        newVisit.user = userId;

        // Save the lead to the database
        const savedLead = await newVisit.save();

        return res.status(200).json({ status : 'success',code : 200,message: "Created Visit successfully",data : savedLead });

    }catch (error){
        console.log(error);
        if (error instanceof mongoose.Error.CastError) {
            return res.status(200).json({ status : 'fail',code : 200,error: "Invalid user ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });

    }

}




// Controller function for user registration



const registerUser = async (req, res) => {
    try {
        // Extract data from the request body
        const { fullName, telephoneNumber  } = req.body;

        const existingUser = await UserData.findOne({ telephoneNumber });
        if(existingUser){
            res.status(200).json({
                status: "400",
                code: 400,
                message: "Mobile number already exists",
                
            });
        }
        
        const mpass = makeid(5);
        const employeeId = "GS"+makeidNumber(4);
    

        // Create a new user document in the database
        const newUserData = new UserData({ fullName, telephoneNumber, employeeId, mpass });
        const savedUserData = await newUserData.save();

        // Send a success response with the created user data
        res.status(200).json({
            status: "200",
            code: 200,
            message: "User created successfully!",
            data: savedUserData
        });
    } catch (error) {
        // Handle potential errors (e.g., database errors)
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


const loginUser = async (req, res) => {
    try {
        const { employeeId, mpass } = req.body;

        // Validation: Check if both fields are provided
        if (!employeeId || !mpass) {
            return res.status(400).json({ error: "Missing employeeId or mpass" });
        }

        // Find the user by employeeId
        const user = await UserData.findOne({ employeeId });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Compare the provided password with the hashed password in the database
        const passwordMatch = user.mpass=req.body.mpass;

        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Successful login: Optionally generate a JWT token for future requests
        // ... (add JWT logic if needed)

        res.status(200).json({
            status: "200",
            code: 200,
            message: "Login successful!",
            data: user // Send relevant user data
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
module.exports = { registerUser,loginUser,updateMpass,createLead,getAllLeads,updateLeadStatus,getAllUsers,deleteLead,deleteUser
    ,getAllUserLeads,
    getAllVisits,
    getUserAttendance,
    createAttendance,
    deleteAttendance
    ,getAllUserVisits,
    getAllAttendance,
    createVisit,deleteVisit };
