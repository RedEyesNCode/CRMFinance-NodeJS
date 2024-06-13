// user_controller.js

const { default: mongoose } = require("mongoose");
const UserLead = require("../models/user_lead_model");
const UserData = require("../models/user_model");
const UserVisit = require("../models/user_visit_model");
const UserAttendance = require("../models/user_attendence_model");
const uploadMiddleWare = require("../aws/FileUpload");
const LoanApproveModel = require("../models/loan_approve_model");
const LoanDisburseModel = require("../models/loan_disburse_model");
const LoanOngoingModel = require("../models/loan_ongoing_model");
const LoanRejectedModel = require("../models/loan_rejected_model");
const LeadCardModel = require("../models/lead_card_model");
const UserRejectedCollection = require("../models/user_collection_Rejected");

const RecycleBin = require("../models/recycler_bin");
const LoanClosedModel = require("../models/loan_closed_model");
const EmiPaymentSchedule = require("../models/emi_payment_schedule");
const UserCollection = require("../models/user_collection_model");
const LRU = require("lru-cache").LRU; // Import the LRU class specifically
const fs = require("fs");
const { jsPDF } = require("jspdf");
const { autoTable } = require("jspdf-autotable");
const fetch = require("node-fetch-cjs");

const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3'); // Import for S3 GetObjectCommand
const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");  // Import getSignedUrl
const UserApprovedCollection = require("../models/user_collection_Approve");

function makeid(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
function makeidNumber(length) {
  let result = "";
  const characters = "0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
// upload-lead-cibil
const uploadLeadCibilPdf = async (req, res) => {
  try {
    const { leadId, leadCibilUrl } = req.body;
    const userLead = await UserLead.findById(leadId);

    console.log("leadID" + leadId);
    console.log(req.body);

    if (userLead != null) {
      userLead.cibil_pdf = leadCibilUrl;
      await userLead.save();
      res.status(200).json({
        status: "success",
        code: 200,
        message: "Uploaded Lead PDF Successfully !",
      });
    } else {
      res
        .status(200)
        .json({ status: "fail", code: 400, message: "Lead not Found !" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(200)
      .json({ status: "fail", code: 500, message: "Internal Server Error" });
  }
};

// upload-file
const uploadFile = async (req, res) => {
  try {
    console.log(req.file);
    console.log(req.body);

    const fileLocation = await req.file.location;

    res
      .status(200)
      .json({ status: "success", code: 200, message: fileLocation });
  } catch (error) {
    console.error(error);
    res.status(200).json({ error: "Internal Server Error" });
  }
};

//update-mpass
const updateMpass = async (req, res) => {
  try {
    const { currentMpass, newMpass, userId } = req.body;

    if (!userId || !currentMpass || !newMpass) {
      return res.status(200).json({
        status: "fail",
        code: 400,
        error: "Missing userId, currentMpass, or newMpass",
      });
    }

    const user = await UserData.findById(userId);
    if (!user) {
      return res
        .status(200)
        .json({ error: "User not found", status: "fail", code: 400 });
    }

    // Direct string comparison for password verification
    if (currentMpass !== user.mpass) {
      return res.status(200).json({
        error: "Incorrect current password",
        status: "fail",
        code: 400,
      });
    }

    user.mpass = newMpass; // Update the password directly
    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
      status: "success",
      code: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({ error: "Internal Server Error" });
  }
};
// controller functon to delete-lead
const deleteLead = async (req, res) => {
  try {
    const { leadId } = req.body;
    const userLead = await UserLead.findByIdAndDelete(leadId);
    saveToRecycleBin(JSON.stringify(userLead), "LEAD");

    if (userLead != null) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Lead Deleted successfully !",
      });
    } else {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No lead found !" });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllRecycleBins = async (req, res) => {
  try {
    const allUsers = await RecycleBin.find();
    if (allUsers.length == 0) {
      return res.status(200).json({
        status: "fail",
        code: 400,
        message: "No recycler data found !",
      });
    } else {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "all-recycled-data",
        data: allUsers,
      });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
async function saveToRecycleBin(jsonData, jsonType) {
  try {
    const newRecycleItem = new RecycleBin({
      json_type: jsonType,

      json_recycle: jsonData,
    });
    const savedItem = await newRecycleItem.save();
    console.log("Data saved to recycle bin:", savedItem);
  } catch (error) {
    console.error("Error saving to recycle bin:", error);
  }
}

// controller function to delete-users
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await UserData.findByIdAndDelete(userId);
    if (user != null) {
      saveToRecycleBin(JSON.stringify(user), "USER");

      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Deleted user successfully !",
      });
    } else {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No users found !" });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getApprovedCollections = async (req, res) => {
  try{
    const allUsers = await UserApprovedCollection.find().sort({ createdAt: -1 });
    return res
    .status(200)
    .json({ code: "200", status: "success", message: "All Approved Collections",data : allUsers });
  }catch(error){
    console.log(error);
    res.status(200).json({status : 'fail',code : 500, message: "Internal Server Error" });

  }

}
const getRejectedCollections = async (req, res) => {
  try{
    const allUsers = await UserRejectedCollection.find().sort({ createdAt: -1 });
    return res
    .status(200)
    .json({ code: "200", status: "success", message: "All Rejected Collections",data : allUsers });
  }catch(error){
    console.log(error);
    res.status(200).json({status : 'fail',code : 500, message: "Internal Server Error" });

  }

}
const getAllLeadCards = async (req,res) => {

  try{
    const allUsers = await LeadCardModel.find().sort({ createdAt: -1 });
    return res
    .status(200)
    .json({ code: "200", status: "success", message: "All Lead Card Templates ",data : allUsers });
  }catch(error){
    console.log(error);
    res.status(200).json({status : 'fail',code : 500, message: "Internal Server Error" });

  }


}

const createLeadCard = async (req,res) => {
  try{
    const {telephoneNumber, pancard, aadhar_card,remarks } = req.body; // Get lead data from the request body
    const existingLead = await LeadCardModel.find({
      telephoneNumber: telephoneNumber,
      pancard: pancard,
      aadhar_card: aadhar_card,
    });
    if (existingLead.length != 0) {
      return res
        .status(200)
        .json({ code: "200", status: "fail", message: "Lead Template Already Exists" });
    }
    const newLeadCard = new LeadCardModel(req.body);
    const saved = await newLeadCard.save();
    return res
        .status(200)
        .json({ code: "200", status: "success", message: "Created Lead Template Successfully !",data : saved });


  }catch(error){
    console.log(error);
    res.status(200).json({status : 'fail',code : 500, message: "Internal Server Error" });


  }


}

const getAdminDashboard = async (req,res) => {
  try{
    const totalEmployees = await UserData.countDocuments();
    const totalVisits = await UserVisit.countDocuments();
    const totalAttendance = await UserAttendance.countDocuments();
    const totalCollections = await UserCollection.countDocuments();
    const totalLeads = await UserLead.countDocuments();
    const lastestLead = await UserLead.find().sort({ createdAt: -1 });
    const lastestVist = await UserVisit.find().sort({ createdAt: -1 });
    const lastestCollection = await UserCollection.find().sort({ createdAt: -1 });
    const lastestAttendance = await UserAttendance.find().sort({ createdAt: -1 });
    const latestUserEntry = await UserData.find().sort({ createdAt: -1 });
    const responseJson = {
      totalEmployees : totalEmployees,
      totalVisits : totalVisits,
      totalAttendance : totalAttendance,
      totalCollections : totalCollections,
      totalLeads : totalLeads,
      latestLeadEntry : lastestLead[0],
      latestVisitEntry : lastestVist[0],
      latestCollectionEntry : lastestCollection[0],
      latestAttendanceEntry : lastestAttendance[0],
      latestUserEntry : latestUserEntry[0]



    };
    return res
        .status(200)
        .json({ code: "200", status: "success", message: "Admin Dashboard !",data : responseJson });

    

  }catch(error){
    console.log(error);
    res.status(200).json({status : 'fail',code : 500, message: "Internal Server Error" });

  }


}

// controller function to get-all-users-with-total-collection amount
const getAllUserTotalAmount = async (req, res) => {
  try {
    const allUsers = await UserData.find().sort({ createdAt: -1 }); // Get all users

    const usersWithTotalCollectionAmount = await Promise.all(
      allUsers.map(async (user) => {
        const totalCollectionAmount = await UserCollection.aggregate([
          { $match: { user: user._id } }, // Filter collections by user
          {
            $group: {
              _id: null, // Single group for total
              total: { $sum: { $toInt: "$collection_amount" } }, // Sum amounts, converting to integers
            },
          },
        ]);

        return {
          ...user.toObject(), // Convert Mongoose document to plain object
          totalCollectionAmount: totalCollectionAmount.length
            ? totalCollectionAmount[0].total
            : 0,
        };
      })
    );

    if (allUsers.length == 0) {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No users found !" });
    } else {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "all-app-users",
        data: usersWithTotalCollectionAmount,
      });
    }
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// controller function to get-all-users
const getAllUsers = async (req, res) => {
  try {
    const allUsers = await UserData.find().sort({ createdAt: -1 });
    if (allUsers.length == 0) {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No users found !" });
    } else {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "all-app-users",
        data: allUsers,
      });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllDisburmentLoans = async (req, res) => {
  try {
    const allLeads = await LoanDisburseModel.find()
      .sort({ createdAt: -1 })
      .populate("user");
    if (allLeads.length == 0) {
      res
        .status(200)
        .json({ status: "fail", code: 400, message: "No Disbursed Loans" });
    } else {
      res.status(200).json({
        status: "success",
        code: 200,
        message: "all-admin-disburments-loans",
        data: allLeads,
      });
    }
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// controller function to get-all-approval-loans

const getAllApprovalLoans = async (req, res) => {
  try {
    const allLeads = await LoanApproveModel.find()
      .sort({ createdAt: -1 })
      .populate("user");
    if (allLeads.length == 0) {
      res
        .status(200)
        .json({ status: "fail", code: 400, message: "No Approved Loans" });
    } else {
      res.status(200).json({
        status: "success",
        code: 200,
        message: "all-admin-approval-loans",
        data: allLeads,
      });
    }
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteDisbursalLoan = async (req, res) => {
  try {
    const { disbursal_loan_id } = req.body;
    const user = await LoanDisburseModel.findByIdAndDelete(disbursal_loan_id);
    saveToRecycleBin(JSON.stringify(user), "LOAN_DISBURSAL");

    if (user != null) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Deleted Disbursal Loan successfully !",
      });
    } else {
      return res.status(200).json({
        status: "fail",
        code: 400,
        message: "No disbursal loan found !",
      });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateDisbursalLoanStatus = async (req, res) => {
  try {
    const { disbursal_loan_id, status, amount, feesAmount, interestRate } =
      req.body;

    const userLead = await LoanDisburseModel.findById(disbursal_loan_id);
    if (userLead) {
      if (status === "ONGOING") {
        userLead.lead_status = status;
        userLead.leadAmount = amount;
        userLead.feesAmount = feesAmount;
        userLead.processingFees = feesAmount;
        userLead.lead_interest_rate = interestRate;
        userLead.disbursementDate = "";
        // update the loan_approve_table as well.

        userLead.lead_status = status;
        await userLead.save();
        const newApprovalLoan = new LoanOngoingModel({
          user: userLead.user,
          employee_lead_id_linker: userLead._id,

          firstName: userLead.firstName,
          lastName: userLead.lastName,
          middleName: userLead.middleName,
          mobileNumber: userLead.mobileNumber,
          dob: userLead.dob,
          gender: userLead.gender,
          pincode: userLead.pincode,
          gs_loan_number: userLead.gs_loan_number,
          gs_loan_password: userLead.gs_loan_password,
          gs_loan_userid: userLead.gs_loan_userid,
          userType: userLead.userType,
          monthlySalary: userLead.monthlySalary,
          relativeName: userLead.relativeName,
          relativeNumber: userLead.relativeNumber,
          currentAddress: userLead.currentAddress,
          state: userLead.state,
          aadhar_front: userLead.aadhar_front,
          aadhar_back: userLead.aadhar_back,
          pancard: userLead.pancard,
          pancard_img: userLead.pancard_img,
          aadhar_card: userLead.aadhar_card,
          selfie: userLead.selfie,
          additional_document: userLead.additional_document,
          cibil_pdf: userLead.cibil_pdf,
          leadAmount: userLead.leadAmount,
          lead_interest_rate: userLead.lead_interest_rate,
          processingFees: userLead.processingFees,
          feesAmount: userLead.feesAmount,
          customerLoanAmount: userLead.customerLoanAmount,
          empApproveAmount: userLead.empApproveAmount,

          lead_status: status,

          dateOfBirth: userLead.dateOfBirth,
          pincode: userLead.pincode,
          gender: userLead.gender,

          disbursementDate: Date.now(),
          is_emi_generated: false,
        });

        await newApprovalLoan.save();
        userLead.lead_status = status;
        await userLead.save();
        res.status(200).json({
          status: "success",
          code: 200,
          ongoing_loan_id: newApprovalLoan._id,
          message:
            "Lead updated successfully & Lead is Moved to Approval Table ",
          data: userLead,
        });
      } else if (status === "DISBURSED") {
        userLead.lead_status = status;
        await userLead.save();

        res.status(200).json({
          status: "success",
          code: 200,
          message: "Loan Approval Table updated successfully ",
          data: userLead,
        });
      } else {
        userLead.lead_status = status;
        await userLead.save();
        res.status(200).json({
          status: "success",
          code: 200,
          message: "Loan Approval Table updated successfully ",
          data: userLead,
        });
      }
    } else {
      res.status(200).json({
        status: "fail",
        code: 200,
        error: "Loan Approval Record Not Found !",
      });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const closeOnGoingLoan = async (req, res) => {
  try {
    const { close_loan_id, status, amount, feesAmount, interestRate } =
      req.body;
    const isCloseAlready = await LoanClosedModel.find({
      employee_lead_id_linker: close_loan_id,
    });

    const userLead = await LoanOngoingModel.findById(close_loan_id);
    if (userLead) {
      if (isCloseAlready.length === 0) {
        if (status === "CLOSED") {
          userLead.lead_status = status;
          userLead.leadAmount = amount;
          userLead.feesAmount = feesAmount;
          userLead.processingFees = feesAmount;
          userLead.lead_interest_rate = interestRate;
          userLead.disbursementDate = "";
          // update the loan_approve_table as well.

          userLead.lead_status = status;
          await userLead.save();
          const newApprovalLoan = new LoanClosedModel({
            user: userLead.user,
            employee_lead_id_linker: userLead._id,

            firstName: userLead.firstName,
            lastName: userLead.lastName,
            middleName: userLead.middleName,
            mobileNumber: userLead.mobileNumber,
            dob: userLead.dob,
            gender: userLead.gender,
            pincode: userLead.pincode,
            gs_loan_number: userLead.gs_loan_number,
            gs_loan_password: userLead.gs_loan_password,
            gs_loan_userid: userLead.gs_loan_userid,
            userType: userLead.userType,
            monthlySalary: userLead.monthlySalary,
            relativeName: userLead.relativeName,
            relativeNumber: userLead.relativeNumber,
            currentAddress: userLead.currentAddress,
            state: userLead.state,
            aadhar_front: userLead.aadhar_front,
            aadhar_back: userLead.aadhar_back,
            pancard: userLead.pancard,
            pancard_img: userLead.pancard_img,
            aadhar_card: userLead.aadhar_card,
            selfie: userLead.selfie,
            additional_document: userLead.additional_document,
            cibil_pdf: userLead.cibil_pdf,
            leadAmount: userLead.leadAmount,
            lead_interest_rate: userLead.lead_interest_rate,
            processingFees: userLead.processingFees,
            feesAmount: userLead.feesAmount,
            customerLoanAmount: userLead.customerLoanAmount,
            empApproveAmount: userLead.empApproveAmount,

            lead_status: status,

            dateOfBirth: userLead.dateOfBirth,
            pincode: userLead.pincode,
            gender: userLead.gender,

            disbursementDate: Date.now(),
            is_emi_generated: false,
          });

          await newApprovalLoan.save();
          userLead.lead_status = status;
          await userLead.save();
          res.status(200).json({
            status: "success",
            code: 200,
            ongoing_loan_id: newApprovalLoan._id,
            message:
              "Lead updated successfully & Lead is Moved to Approval Table ",
            data: userLead,
          });
        } else if (status === "DISBURSED") {
          userLead.lead_status = status;
          await userLead.save();

          res.status(200).json({
            status: "success",
            code: 200,
            message: "Loan Approval Table updated successfully ",
            data: userLead,
          });
        } else {
          userLead.lead_status = status;
          await userLead.save();
          res.status(200).json({
            status: "success",
            code: 200,
            message: "Loan Approval Table updated successfully ",
            data: userLead,
          });
        }
      } else {
        res.status(200).json({
          status: "fail",
          code: 400,
          message: "Ongoing-Loan Already present in Closed Loan Table",
          data: userLead,
        });
      }
    } else {
      res.status(200).json({
        status: "fail",
        code: 200,
        error: "Loan Closed Record Not Found !",
      });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const updateEmpLead = async (req, res) => {
  try {
    const leadId = req.body.leadId;
    const updateData = req.body; // Data to update the lead with

    // 1. Input Validation (Important!)
    if (!leadId) {
      return res.status(400).json({ error: "Missing leadId in the URL" });
    }

    // You can add more validation here for specific fields if needed
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update data provided" });
    }

    // 2. Find and Update the Lead
    const updatedLead = await UserLead.findByIdAndUpdate(
      leadId,
      updateData,
      { new: true } // Return the updated lead
    );

    if (!updatedLead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // 3. Additional Logic (Optional)
    // You might want to log the update, trigger notifications, etc.

    // 4. Response
    res.status(200).json(updatedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// check unique lead
const checkUniqueLead = async (req, res) => {
  try {
    const { number, pancard, aadhar } = req.body;

    const existingLead = await UserLead.find({
      $or: [
        { mobileNumber: number },
        { panCard: pancard },
        { aadhar_card: aadhar },
      ],
    });

    if (existingLead.length === 0) {
      res.status(200).json({
        message: "New Lead Found",
        status: "success",
        code: 200,
      });
    } else {
      res.status(200).json({
        message: "Lead already exists",
        status: "fail",
        code: 400,
      });
    }
  } catch (error) {
    console.error("Error checking for unique lead:", error);
    res.status(200).json({
      message: "Internal server error",
      status: "error",
      code: 500,
    });
  }
};

// controller function to update-amount-in-all-tables.
const updateAmountFields = async (req, res) => {
  try {
    const {
      leadId,
      loan_approval_id,
      leadAmount,
      tenure,
      processingFees,
      interestRate,
      emi,
      totalInterest,
      monthlyInterest,
    } = req.body;
    const loanApproval = await LoanApproveModel.findById(loan_approval_id);
    const leadEmp = await UserLead.findById(leadId);
    if (loanApproval != null && leadEmp != null) {
      loanApproval.leadAmount = leadAmount;
      loanApproval.processingFees = processingFees;
      loanApproval.lead_interest_rate = interestRate;
      await loanApproval.save();
      // update the emp table as well.
      leadEmp.leadAmount = leadAmount;
      leadEmp.processingFees = processingFees;
      leadEmp.lead_interest_rate = interestRate;
      await leadEmp.save();
      res.status(200).json({
        status: "success",
        code: 200,
        message: "Update of Amount in APPROVAL AND EMP-LEAD TABLE",
      });
    } else {
      res.status(200).json({
        status: "fail",
        code: 400,
        message: "Approval Loan or Lead Employee not found in Database. ",
        data: userLead,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(200).json({
      status: "fail",
      code: 400,
      message: "Internal Server Error. ",
      data: userLead,
    });
  }
};
const calculateTotals = async (req, res) => {
  try {
    const { emi_payment_id } = req.body;

    if (!emi_payment_id) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: "EMI Payment ID is required.",
      });
    }

    const emiSchedule = await EmiPaymentSchedule.findById(emi_payment_id);

    if (!emiSchedule) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "EMI Schedule not found.",
      });
    }

    let totalAmountPaid = 0;
    let totalAmountUnpaid = 0;

    for (const payment of emiSchedule.payments) {
      const amount =
        parseFloat(payment.principalAmount) +
        parseFloat(payment.interestAmount); // Convert to float for calculation
      if (payment.paymentStatus === "paid") {
        totalAmountPaid += amount;
      } else {
        totalAmountUnpaid += amount;
      }
    }

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "EMI Amount Detail.",
      totalUnpaid: totalAmountUnpaid.toFixed(2), // Convert to fixed decimal places
      totalPaid: totalAmountPaid.toFixed(2), // Convert to fixed decimal places
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Error calculating totals: " + error.message,
    });
  }
};

// controller function to update-loan-approval
const updateLoanApprovalStatus = async (req, res) => {
  try {
    const {
      loan_approval_id,
      status,
      amount,
      feesAmount,
      interestRate,
      emi_tenure,
      disbursement_date,
      emi_first_date,
    } = req.body;

    const userLead = await LoanApproveModel.findById(loan_approval_id);
    const isDisbursalThere = await LoanDisburseModel.find({
      employee_lead_id_linker: loan_approval_id,
    });
    const isRejectedThere = await LoanRejectedModel.find({
      employee_lead_id_linker: loan_approval_id,
    });
    const isOngoingThere = await LoanOngoingModel.find({
      employee_lead_id_linker: loan_approval_id,
    });

    if (isOngoingThere.length != 0) {
      res.status(200).json({
        status: "fail",
        code: 400,
        message:
          "Loan is already present in Ongoing & Disbursement Loan Table. ",
        data: userLead,
      });
    } else {
      if (userLead) {
        if (status === "DISBURSED") {
          if (isDisbursalThere.length != 0) {
            res.status(200).json({
              status: "fail",
              code: 400,
              message: "Loan  is already present in disbursal table",
              data: userLead,
            });
          } else {
            userLead.lead_status = status;
            userLead.leadAmount = amount;
            userLead.feesAmount = feesAmount;
            userLead.processingFees = feesAmount;
            userLead.lead_interest_rate = interestRate;
            userLead.disbursementDate = "";
            const newApprovalLoan = new LoanDisburseModel({
              user: userLead.user,
              employee_lead_id_linker: userLead._id,

              firstName: userLead.firstName,
              lastName: userLead.lastName,
              middleName: userLead.middleName,
              mobileNumber: userLead.mobileNumber,
              dob: userLead.dob,
              gender: userLead.gender,
              pincode: userLead.pincode,
              gs_loan_number: userLead.gs_loan_number,
              gs_loan_password: userLead.gs_loan_password,
              gs_loan_userid: userLead.gs_loan_userid,
              userType: userLead.userType,
              monthlySalary: userLead.monthlySalary,
              relativeName: userLead.relativeName,
              relativeNumber: userLead.relativeNumber,
              currentAddress: userLead.currentAddress,
              state: userLead.state,
              aadhar_front: userLead.aadhar_front,
              aadhar_back: userLead.aadhar_back,
              pancard: userLead.pancard,
              pancard_img: userLead.pancard_img,
              aadhar_card: userLead.aadhar_card,
              selfie: userLead.selfie,
              additional_document: userLead.additional_document,
              cibil_pdf: userLead.cibil_pdf,
              leadAmount: userLead.leadAmount,
              lead_interest_rate: userLead.lead_interest_rate,
              processingFees: userLead.processingFees,
              feesAmount: userLead.feesAmount,
              customerLoanAmount: userLead.customerLoanAmount,
              empApproveAmount: userLead.empApproveAmount,

              lead_status: status,

              dateOfBirth: userLead.dateOfBirth,
              pincode: userLead.pincode,
              gender: userLead.gender,

              disbursementDate: Date.now(),
              is_emi_generated: false,
            });

            await newApprovalLoan.save();

            const newOngoingLoan = new LoanOngoingModel({
              user: userLead.user,
              employee_lead_id_linker: userLead._id,

              firstName: userLead.firstName,
              lastName: userLead.lastName,
              middleName: userLead.middleName,
              mobileNumber: userLead.mobileNumber,
              dob: userLead.dob,
              gender: userLead.gender,
              pincode: userLead.pincode,
              gs_loan_number: userLead.gs_loan_number,
              gs_loan_password: userLead.gs_loan_password,
              gs_loan_userid: userLead.gs_loan_userid,
              userType: userLead.userType,
              monthlySalary: userLead.monthlySalary,
              relativeName: userLead.relativeName,
              relativeNumber: userLead.relativeNumber,
              currentAddress: userLead.currentAddress,
              state: userLead.state,
              aadhar_front: userLead.aadhar_front,
              aadhar_back: userLead.aadhar_back,
              pancard: userLead.pancard,
              pancard_img: userLead.pancard_img,
              aadhar_card: userLead.aadhar_card,
              selfie: userLead.selfie,
              additional_document: userLead.additional_document,
              cibil_pdf: userLead.cibil_pdf,
              leadAmount: userLead.leadAmount,
              lead_interest_rate: userLead.lead_interest_rate,
              processingFees: userLead.processingFees,
              feesAmount: userLead.feesAmount,
              customerLoanAmount: userLead.customerLoanAmount,
              empApproveAmount: userLead.empApproveAmount,

              lead_status: "ACTIVE",

              dateOfBirth: userLead.dateOfBirth,
              pincode: userLead.pincode,
              gender: userLead.gender,

              disbursementDate: Date.now(),
              is_emi_generated: false,
            });
            await newOngoingLoan.save();

            userLead.lead_status = status;
            await userLead.save();

            // Update the lead table as well to disbursed status.
            const empLead = await UserLead.findById(
              userLead.employee_lead_id_linker
            );
            if (empLead != null) {
              console.log(empLead._id);

              empLead.lead_status = "DISBURSED";
              empLead.disbursementDate = Date.now();

              await empLead.save();
              // Design the Emi payment schedule as well in the on-going table.
              const P = parseFloat(amount);
              const R = parseFloat(interestRate) / 100 / 12; // Monthly interest rate
              const N = parseFloat(emi_tenure);

              // Flat EMI Calculation
              const monthlyInterest = P * R;
              const totalInterest = monthlyInterest * N;
              const EMI = (P + totalInterest) / N;
              const totalAmount = EMI * N;
              console.log(req.body);
              const emiPaymentArray = generateEmiSchedule(req.body);
              console.log(emiPaymentArray);

              const emiPaymentSchedule = new EmiPaymentSchedule({
                loanId: newOngoingLoan._id,
                totalLoanAmount: totalAmount.toString(),
                interestRate: interestRate,
                totalInterest: totalInterest.toString(),
                monthlyInterest: monthlyInterest,

                loanTenureMonths: emi_tenure,
                startDate: Date.now(),
                emiAmount: EMI.toString(),
                paymentFrequency: "monthly",
                payments: emiPaymentArray,
              });

              await emiPaymentSchedule.save();

              return res.status(200).json({
                status: "success",
                code: 200,
                message:
                  "Approval Loan Updated updated successfully & Loan is Moved to Disbursal Table " +
                  emiPaymentSchedule._id,
                data: userLead,
              });
            } else {
              return res.status(200).json({
                status: "fail",
                code: 400,
                message:
                  "Original Lead is Not Found, Hence Data is not updated in All Tables",
                data: userLead,
              });
            }
          }
        } else if (status === "REJECTED") {
          if (isRejectedThere.length != 0) {
            res.status(200).json({
              status: "fail",
              code: 400,
              message: "Loan is already present in Rejected Loan Table. ",
              data: userLead,
            });
          } else {
            userLead.lead_status = status;
            userLead.leadAmount = amount;
            userLead.feesAmount = feesAmount;
            userLead.processingFees = feesAmount;
            userLead.lead_interest_rate = interestRate;
            userLead.disbursementDate = "";

            const newOngoingLoan = new LoanRejectedModel({
              user: userLead.user,
              employee_lead_id_linker: userLead._id,

              firstName: userLead.firstName,
              lastName: userLead.lastName,
              middleName: userLead.middleName,
              mobileNumber: userLead.mobileNumber,
              dob: userLead.dob,
              gender: userLead.gender,
              pincode: userLead.pincode,
              gs_loan_number: userLead.gs_loan_number,
              gs_loan_password: userLead.gs_loan_password,
              gs_loan_userid: userLead.gs_loan_userid,
              userType: userLead.userType,
              monthlySalary: userLead.monthlySalary,
              relativeName: userLead.relativeName,
              relativeNumber: userLead.relativeNumber,
              currentAddress: userLead.currentAddress,
              state: userLead.state,
              aadhar_front: userLead.aadhar_front,
              aadhar_back: userLead.aadhar_back,
              pancard: userLead.pancard,
              pancard_img: userLead.pancard_img,
              aadhar_card: userLead.aadhar_card,
              selfie: userLead.selfie,
              additional_document: userLead.additional_document,
              cibil_pdf: userLead.cibil_pdf,
              leadAmount: userLead.leadAmount,
              lead_interest_rate: userLead.lead_interest_rate,
              processingFees: userLead.processingFees,
              feesAmount: userLead.feesAmount,
              customerLoanAmount: userLead.customerLoanAmount,
              empApproveAmount: userLead.empApproveAmount,

              lead_status: status,

              dateOfBirth: userLead.dateOfBirth,
              pincode: userLead.pincode,
              gender: userLead.gender,

              disbursementDate: Date.now(),
              is_emi_generated: false,
            });
            await newOngoingLoan.save();
            userLead.lead_status = status;
            await userLead.save();
            // Update the lead table as well to disbursed status.
            const empLead = await UserLead.findById(
              userLead.employee_lead_id_linker
            );
            if (empLead != null) {
              console.log(empLead._id);
              empLead.lead_status = "REJECTED";
              await empLead.save();

              res.status(200).json({
                status: "success",
                code: 200,
                message:
                  "Approval Loan Updated updated successfully & Loan is Moved to Rejected Table ",
                data: userLead,
              });
            } else {
              res.status(200).json({
                status: "fail",
                code: 400,
                message:
                  "Original Lead is Not Found, Hence Data is not updated in All Tables",
                data: userLead,
              });
            }
          }
        } else {
          userLead.lead_status = status;
          await userLead.save();
          const empLead = await UserLead.findById(userLead._id);
          if (empLead) {
            empLead.lead_status = status;
            empLead.save();
          }
          res.status(200).json({
            status: "success",
            code: 200,
            message: "Loan Approval Table updated successfully ",
            data: userLead,
          });
        }
      } else {
        res.status(200).json({
          status: "fail",
          code: 200,
          error: "Loan Approval Record Not Found !",
        });
      }
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

function generateEmiSchedule(loanData) {
  const P = parseFloat(loanData.amount);
  const R = parseFloat(loanData.interestRate) / 100 / 12;
  const N = parseFloat(loanData.emi_tenure); // Assuming 'tenure' is included in loanData

  const EMI = (P + P * R * N) / N;

  const schedule = [];
  let currentDate = new Date(loanData.emi_first_date);
  let remainingPrincipal = P;

  for (let i = 0; i < N; i++) {
    const interestAmount = remainingPrincipal * R;
    const principalAmount = EMI - interestAmount;
    remainingPrincipal -= principalAmount;

    schedule.push({
      dueDate: new Date(currentDate),
      amountDue: parseFloat(EMI.toFixed(2)),
      principalAmount: parseFloat(principalAmount.toFixed(2)),
      interestAmount: parseFloat(interestAmount.toFixed(2)),
      paymentStatus: "pending",
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return schedule;
}

// controller function to update-lead
const updateLeadStatus = async (req, res) => {
  try {
    const { leadId, status, amount, feesAmount, interestRate } = req.body;

    const userLead = await UserLead.findById(leadId);
    if (userLead) {
      if (status === "APPROVED") {
        userLead.lead_status = status;
        userLead.leadAmount = amount;
        userLead.feesAmount = feesAmount;
        userLead.processingFees = feesAmount;
        userLead.lead_interest_rate = interestRate;
        userLead.disbursementDate = "";
        // update the loan_approve_table as well.

        userLead.lead_status = status;
        await userLead.save();
        const isApprovalThere = await LoanApproveModel.find({
          employee_lead_id_linker: leadId,
        });
        if (isApprovalThere.length === 0) {
          const newApprovalLoan = new LoanApproveModel({
            user: userLead.user,
            employee_lead_id_linker: userLead._id,

            firstName: userLead.firstName,
            lastName: userLead.lastName,
            middleName: userLead.middleName,
            mobileNumber: userLead.mobileNumber,
            dob: userLead.dob,
            gender: userLead.gender,
            pincode: userLead.pincode,
            gs_loan_number: userLead.gs_loan_number,
            gs_loan_password: userLead.gs_loan_password,
            gs_loan_userid: userLead.gs_loan_userid,
            userType: userLead.userType,
            monthlySalary: userLead.monthlySalary,
            relativeName: userLead.relativeName,
            relativeNumber: userLead.relativeNumber,
            currentAddress: userLead.currentAddress,
            state: userLead.state,
            aadhar_front: userLead.aadhar_front,
            aadhar_back: userLead.aadhar_back,
            pancard: userLead.pancard,
            pancard_img: userLead.pancard_img,
            aadhar_card: userLead.aadhar_card,
            selfie: userLead.selfie,
            additional_document: userLead.additional_document,
            cibil_pdf: userLead.cibil_pdf,
            leadAmount: userLead.leadAmount,
            lead_interest_rate: userLead.lead_interest_rate,
            processingFees: userLead.processingFees,
            feesAmount: userLead.feesAmount,
            customerLoanAmount: userLead.customerLoanAmount,
            empApproveAmount: userLead.empApproveAmount,

            lead_status: status,

            dateOfBirth: userLead.dateOfBirth,
            pincode: userLead.pincode,
            gender: userLead.gender,

            disbursementDate: "",
            is_emi_generated: false,
          });

          await newApprovalLoan.save();
          res.status(200).json({
            status: "success",
            code: 200,
            approval_loan_id: newApprovalLoan._id,
            message:
              "Lead updated successfully & Lead is Moved to Approval Table ",
            data: userLead,
          });
        } else {
          res.status(200).json({
            status: "fail",
            code: 400,
            message: "Lead is Already Present in Approval Table",
          });
        }
      } else if (status === "DISBURSED") {
        userLead.disbursementDate = Date.now();
        userLead.lead_status = status;
        await userLead.save();

        res.status(200).json({
          status: "success",
          code: 200,
          message: "Lead updated successfully ",
          data: userLead,
        });
      } else {
        userLead.lead_status = status;
        await userLead.save();
        res.status(200).json({
          status: "success",
          code: 200,
          message: "Lead updated successfully ",
          data: userLead,
        });
      }
    } else {
      res
        .status(200)
        .json({ status: "fail", code: 200, error: "User Lead Not Found !" });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// controller function to get-all-leads
// const getAllLeads = async (req, res) => {

//   try {

//     const allLeads = await UserLead.find().sort({ createdAt: -1 }).populate("user");

//     console.log(allLeads); // Log the raw results to check the order

//     if (allLeads.length == 0) {
//       res
//         .status(200)
//         .json({ status: "fail", code: 200, error: "No Leads Exists" });
//     } else {
//       res.status(200).json({
//         status: "success",
//         code: 200,
//         message: "all-admin-leads",
//         data: allLeads,
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     if (error instanceof mongoose.Error.CastError) {
//       return res
//         .status(200)
//         .json({ status: "fail", code: 200, error: "Invalid user ID format" });
//     }
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };
const getAllLeads = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 100;

    const skip = (page - 1) * limit;

    const allLeads = await UserLead.find()
      .sort({ createdAt: -1 })
      .populate("user")
      .skip(skip) // Apply skip to exclude previous results
      .limit(limit);

    const totalLeads = await UserLead.countDocuments();
    res.setHeader("Cache-Control", "private, max-age=60"); // Cache for 60 seconds (adjust as needed)

    if (allLeads.length === 0) {
      res
        .status(200)
        .json({ status: "fail", code: 200, error: "No Leads Exists" });
    } else {
      res.status(200).json({
        status: "success",
        code: 200,
        message: "all-admin-leads",
        data: allLeads,
        currentPage: page,
        totalCount: totalLeads,
        totalPages: Math.ceil(totalLeads / limit), // Calculate total pages
      });
    }
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDisbursalLoanDetail = async (req, res) => {
  try {
    const { disbursal_loan_id } = req.body;

    const lead = await LoanDisburseModel.findById(disbursal_loan_id);
    if (lead != null) {
      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Record Found !",
        data: lead,
      });
    } else {
      return res.status(200).json({
        code: 400,
        status: "fail",
        message: "Disbursal Loan Not Found not found",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const ongoingEmiDetail = async (req, res) => {
  try {
    const { ongoing_loan_id } = req.body;

    const lead = await EmiPaymentSchedule.find({ loanId: ongoing_loan_id });
    if (lead != null) {
      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Record Found !",
        data: lead,
      });
    } else {
      return res
        .status(200)
        .json({ code: 400, status: "fail", message: "Ongoing Loan not found" });
    }
  } catch (error) {
    console.log(error);
  }
};

const getOngoingLoanDetail = async (req, res) => {
  try {
    const { ongoing_loan_id } = req.body;

    const lead = await LoanOngoingModel.findById(ongoing_loan_id);
    if (lead != null) {
      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Record Found !",
        data: lead,
      });
    } else {
      return res
        .status(200)
        .json({ code: 400, status: "fail", message: "Ongoing Loan not found" });
    }
  } catch (error) {
    console.log(error);
  }
};

const getRejectedDetails = async (req, res) => {
  try {
    const { rejected_loan_id } = req.body;

    const lead = await LoanRejectedModel.findById(rejected_loan_id);
    if (lead != null) {
      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Record Found !",
        data: lead,
      });
    } else {
      return res
        .status(200)
        .json({ code: 400, status: "fail", message: "Lead not found" });
    }
  } catch (error) {
    console.log(error);
  }
};
const getClosedLoanDetails = async (req, res) => {
  try {
    const { closed_loan_id } = req.body;

    const lead = await LoanClosedModel.findById(closed_loan_id);
    if (lead != null) {
      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Record Found !",
        data: lead,
      });
    } else {
      return res
        .status(200)
        .json({ code: 400, status: "fail", message: "Closed Loan not found" });
    }
  } catch (error) {
    console.log(error);
  }
};

const getLeadEmi = async (req, res) => {
  try {
    const { leadId, emi_tenure } = req.body;
    const lead = await UserLead.findById(leadId);
    if (lead) {
      const P = parseFloat(lead.leadAmount);
      const R = parseFloat(lead.lead_interest_rate) / 100 / 12; // Monthly interest rate
      const N = parseFloat(emi_tenure);

      // Flat EMI Calculation
      const monthlyInterest = P * R;
      const totalInterest = monthlyInterest * N;
      const EMI = (P + totalInterest) / N;
      const totalAmount = EMI * N;
      console.log(req.body);

      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Emi Details",
        monthly_interest: monthlyInterest,
        total_interest: totalInterest,
        emi_amount: EMI,
        total_amount: totalAmount,
      });

      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Emi Details",
        monthly_interest: monthlyInterest,
        total_interest: totalInterest,
        emi_amount: EMI,
        total_amount: totalAmount,
        payment_array: emiPaymentArray,
      });
    } else {
      return res
        .status(200)
        .json({ code: 400, status: "fail", message: "Lead not found" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(200)
      .json({ code: 500, status: "fail", message: "Internal server error" });
  }
};

const getCurrentMonthLeadsUser = async (req, res) => {
  try {
      const userId = req.body.userId; // Assuming you send userId in the request body

      // Get the start and end dates for the current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch leads using Mongoose query
      const leads = await UserLead.find({
          user: userId,
          createdAt: {
              $gte: startOfMonth, 
              $lt: endOfMonth
          }
      });
      if(leads.length===0){
        return res.status(200).json({
          code: 400,
          status: "fail",
          message: "No Leads Found for given user",
      });
      }else{
        return res.status(200).json({
          code: 200,
          status: "success",
          message: "Current month's leads fetched successfully",
          data: leads
      });
      }

      
  } catch (error) {
      console.error(error);
      return res.status(500).json({
          code: 500,
          status: "fail",
          message: "Internal server error",
          error: error.message // Send only the error message for security
      });
  }
};
// controller function to get-lead-by-id
const getLeadDetails = async (req, res) => {
  try {
    const { leadId } = req.body;

    const lead = await UserLead.findById(leadId).populate("user");
    if (lead != null) {
      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Record Found !",
        data: lead,
      });
    } else {
      return res
        .status(200)
        .json({ code: 400, status: "fail", message: "Lead not found" });
    }
  } catch (error) {
    console.log(error);
  }
};

const getLoanApprovalDetails = async (req, res) => {
  try {
    const { loan_approval_id } = req.body;

    const lead = await LoanApproveModel.findById(loan_approval_id);
    if (lead != null) {
      return res.status(200).json({
        code: 200,
        status: "success",
        message: "Record Found !",
        data: lead,
      });
    } else {
      return res.status(200).json({
        code: 400,
        status: "fail",
        message: "Loan Approval not found",
      });
    }
  } catch (error) {
    console.log(error);
  }
};
const deleteUserCollection = async (req, res) => {
  try {
    const collection = await UserCollection.findById(req.body.collection_id);
    if (collection) {
      await collection.deleteOne();
      return res.status(200).json({
        status: "200",
        code: 200,
        message: "Collection Deleted Successfully !",
      });
    } else {
      return res.status(200).json({
        status: "200",
        code: 200,
        message: "Collection Not Found !",
      });
    }
  } catch (error) {
    console.log(error);
  }


}
const deleteLeadCard = async(req,res) => {

  try{
    const {leadCardId} = req.body;
    const userLead = await LeadCardModel.findByIdAndDelete(leadCardId);
    saveToRecycleBin(JSON.stringify(userLead), "LEAD_CARD");

    if (userLead != null) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Lead Card Deleted successfully !",
      });
    } else {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No Lead Card found !" });
    }

  }catch(error){
    console.log(error);
    res.status(200).json({status : 'fail',code : 500, message: "Internal Server Error" });

  }
}






// controller function to create-lead

const createLead = async (req, res) => {
  try {
    const { userId, mobileNumber, pancard, aadhar_card } = req.body; // Get lead data from the request body
    console.log(req.body);
    const leadCount = await UserLead.find();

    // Check if userId is valid
    const user = await UserData.findById(userId);
    if (!user) {
      return res
        .status(200)
        .json({ code: "200", status: "fail", message: "User not found" });
    }
    const existingLead = await UserLead.find({
      mobileNumber: mobileNumber,
      pancard: pancard,
      aadhar_card: aadhar_card,
    });
    const existingLeadCard = await LeadCardModel.find({
      telephoneNumber: mobileNumber,
      pancard: pancard,
      aadhar_card: aadhar_card,
    });

    if (existingLead.length != 0) {
      return res
        .status(200)
        .json({ code: "200", status: "fail", error: "Lead Already Exists" });
    }
    if (existingLeadCard.length != 0) {
      return res
        .status(200)
        .json({ code: "200", status: "fail", error: "Lead Card Already Exists" });
    }

    // Create a new UserLead document
    const newLead = new UserLead(req.body);
    newLead.user = userId;
    newLead.generated_loan_id = "GS" + leadCount.length + 1;

    // const initialCounter = new Counter({ _id: 'userLeadId', seq: 0 });
    // await initialCounter.save();
    // Save the lead to the database
    const savedLead = await newLead.save();

    return res.status(200).json({
      status: "200",
      code: 200,
      message: "Lead created successfully!",
      data: savedLead,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, message: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// controller function to delete-visit
const deleteVisit = async (req, res) => {
  try {
    const { visit_Id } = req.body;
    const userLead = await UserVisit.findByIdAndDelete(visit_Id);
    saveToRecycleBin(JSON.stringify(userLead), "VISIT");

    if (userLead != null) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Visit Deleted successfully !",
      });
    } else {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No Visit found !" });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, message: "Invalid user ID format" });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const deleteApprovalLoan = async (req, res) => {
  try {
    const { loan_approval_id } = req.body;
    const userLead = await LoanApproveModel.findByIdAndDelete(loan_approval_id);
    saveToRecycleBin(JSON.stringify(userLead), "LOAN_APPROVAL");

    if (userLead != null) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Approval Loan Deleted successfully !",
      });
    } else {
      return res.status(200).json({
        status: "fail",
        code: 400,
        message: "No Approval Loan found !",
      });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, message: "Invalid user ID format" });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllUserApprovedLeads = async (req, res) => {
  try {
    const userLead = await UserLead.find({
      user: req.body.userId,
      lead_status: "APPROVED",
    });
    if (userLead.length != 0) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "User Leads Fetched successfully !",
        data: userLead,
      });
    } else {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No User Leads found !" });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const searchUserLeadsByDate = async (req, res) => {
  try {
    const { userId, fromDate, toDate } = req.body;

    // Date Validation (Ensure valid date formats)
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (isNaN(startDate) || isNaN(endDate)) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Please use YYYY-MM-DD" });
    }

    // Query Logic
    const leads = await UserLead.find({
      user: userId,
      createdAt: {
        $gte: startDate, // Greater than or equal to fromDate
        $lte: endDate, // Less than or equal to toDate
      },
    });

    res.json({
      status: "success",
      code: 200,
      message: "User-Filtered-Leads-Date",
      data: leads,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const searchUserLeads = async (req, res) => {
  try {
    const userId = req.body.userId;
    const queryText = req.body.queryText;

    // Search Logic (Case-Insensitive)
    const leads = await UserLead.find({
      user: userId,
      $or: [
        { firstName: { $regex: queryText, $options: "i" } }, // Case-insensitive search
      ],
    });

    res.status(200).json({
      status: "success",
      code: 200,
      message: "User-Filtered-Leads-Text",
      data: leads,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const searchUserLeadsByStatus = async (req, res) => {
  try {
    const { fromDate, toDate, lead_status, userId } = req.body;
    // Input Validation (Optional but recommended)
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (
      !["EMPTY", "PENDING", "APPROVED", "REJECTED", "DISBURSED"].includes(
        lead_status
      )
    ) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    // Parse the dates from YYYY-MM-DD format
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Set the 'to' date to the end of the day
    to.setHours(23, 59, 59, 999);
    let query = {
      user: userId,

      createdAt: {
        $gte: from,
        $lte: to,
      },
    };
    if(toDate.length===0 || fromDate.length===0){
      query = {
        user: userId,
        lead_status : lead_status
      }

    }


    
    if (lead_status.length!=0) {
      query.lead_status = lead_status;
    }
    // Execute the query
    const leads = await UserLead.find(query);

    if (leads.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Lead found",
      });
    }

    res.status(200).json({
      status: "success",
      code: 200,
      message: "filtered-leads",
      data: leads,
    });

    // Query Logic
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
///Changes by rishi
const getLeadsByDateAndStatusName = async (req, res) => {
  console.log(req.body);
  try {
    const { fromDate, toDate, lead_status, firstName } = req.body;
    // Parse the dates from YYYY-MM-DD format
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Set the 'to' date to the end of the day
    to.setHours(23, 59, 59, 999);

    let query = {
      createdAt: {
        $gte: from,
        $lte: to,
      },
    };

    // Add lead_status to query if provided
    if (lead_status) {
      query.lead_status = lead_status;
    }

    // Add firstName filter using regex if provided
    if (firstName) {
      query.firstName = { $regex: firstName, $options: "i" }; // 'i' makes it case-insensitive
    }

    // Execute the query
    const leads = await UserLead.find(query).populate("user");

    if (leads.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Lead found",
      });
    }

    res.json({
      status: "success",
      code: 200,
      message: "filtered-leads",
      data: leads,
    });
  } catch (error) {
    res.json({
      status: "Failed",
      code: 500,
      message: error.message,
    });
  }
};

const updateUserCollectionAmount = async (req,res) => {

  try{
    console.log(req.body);
    const user = await UserData.findById(req.body.userId);
    if(user){
      const totalCollectionAmount = Number(user.totalCollectionAmount);
      if(totalCollectionAmount>=req.body.collection_amount){
        user.totalCollectionAmount = totalCollectionAmount - Number(req.body.collection_amount);
        await user.save();

        return res.status(200).json({
          status: "success",
          code: 200,
          message: "Total Collection Amount of Employee is Updated !",
        });
      }else{
        return res.status(200).json({
          status: "fail",
          code: 400,
          message: "New Amount Exceeds Total Collection Amount",
        });
      }

    }else{
      return res.status(200).json({
        status: "Success",
        code: 400,
        message: "No User found",
      });
    }

  }catch(error){
    console.log(error);
    return res.status(200).json({
      status: "fail",
      code: 500,
      message: "Internal Server Error",
      error : error,
    });
  }



}


const updateUserCollection = async (req, res) => {
  try {
    console.log(req.body);
    const collection = await UserCollection.findById(req.body.collection_id);

    if (collection) {
      if (req.body.status === "APPROVED") {
        collection.collection_status = req.body.status;

        const updatedCollectionAmount =
          Number(collection.collection_amount) -
          Number(req.body.approved_collection_amount);
        collection.collection_amount = updatedCollectionAmount;
        await collection.save();
        const isApproved = await UserApprovedCollection.find({
          user: req.body.userrId,
        });
        if (isApproved.length === 0) {
          const AppoveColl = new UserApprovedCollection({
            user: req.body.userId,
            fullName: collection.fullName,
            customer_name: collection.customer_name,
            customer_mobile: collection.customer_mobile,
            customer_penalty: collection.customer_penalty,
            customer_emi_id: collection.customer_emi_id,
            customer_loan_id: collection.customer_loan_id,
            collection_amount: collection.collection_amount,
            collection_location: collection.collection_location,
            collection_address: collection.collection_address,
            collection_status: collection.collection_status,
            generated_emi_bill: collection.generated_emi_bill,
          });
          await AppoveColl.save();
          res.status(200).json({
            status: "success",
            code: 200,
            message: "You have approved the employee collection",
            data: collection,
            approveData: AppoveColl,
          });
        } else {
          res.status(200).json({
            status: "success",
            code: 200,
            message: "You have approved the employee collection",
            data: collection,
            approveData: isApproved,
          });
        }
      } else {
        collection.collection_status = req.body.status;
        await collection.save();
        const isRejected = await UserRejectedCollection.find({
          user: req.body.userrId,
        });
        if (isRejected.length === 0) {
          const RejectedColl = new UserRejectedCollection({
            user: req.body.userId,
            fullName: collection.fullName,
            customer_name: collection.customer_name,
            customer_mobile: collection.customer_mobile,
            customer_penalty: collection.customer_penalty,
            customer_emi_id: collection.customer_emi_id,
            customer_loan_id: collection.customer_loan_id,
            collection_amount: collection.collection_amount,
            collection_location: collection.collection_location,
            collection_address: collection.collection_address,
            collection_status: collection.collection_status,
            generated_emi_bill: collection.generated_emi_bill,
          });
          await RejectedColl.save();
          res.status(200).json({
            status: "success",
            code: 200,
            message: "You have rejected the employee collection",
            RejectedData: RejectedColl,
          });
        } else {
          res.status(200).json({
            status: "success",
            code: 200,
            message: "You have rejected the employee collection",
            RejectedData: isRejected,
          });
        }
      }
    } else {
      res.status(200).json({
        status: "fail",
        code: 200,
        message: "User Collection Not Found !",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getUserCollection = async (req, res) => {
  try {
    const userCollections = await UserCollection.find({
      user: req.body.userId,
    }).sort({ createdAt: -1 });
    if (userCollections.length === 0) {
      res.status(200).json({
        status: "fail",
        code: 200,
        message: "User Collection Not Found !",
      });
    } else {
      res.status(200).json({
        status: "fail",
        code: 200,
        message: "User Collection Records !",
        data: userCollections,
      });
    }
  } catch (error) {
    res.status(200).json({
      status: "fail",
      code: 500,
      message: "Internal Server Error",
    });

    console.log(error);
  }
};
const s3 = new S3Client({
  credentials: {
    secretAccessKey: "f6/nS6glE8s9aeW3c0QVzxjcRY1Co/ATdNdAVhXw",
    accessKeyId: "AKIA4MTWKENW4EBCBQNF",
  },
  region: "ap-south-1",
});
async function getS3FileUrl(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: "androidbucket3577",
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60000 }); // Get presigned URL, valid for 1 hour
    return url;
  } catch (error) {
    console.error("Error getting S3 URL:", error);
    throw error; // Or handle the error as needed
  }
}
// async function generatePDF(emiData) {
//   console.log(emiData);
//   const doc = new jsPDF({
//     orientation: "portrait",
//     unit: "mm",
//     format: [80, 150], // Adjust size as needed (roughly food bill size)
//   });

//   // Header (Company Logo & Name)
//   const logoUrl =
//   "https://androidbucket3577.s3.ap-south-1.amazonaws.com/ic_gs_blue_red.jpeg";
//   const logoWidth = 40;
//   const logoHeight = (logoWidth * 25) / 60; // Maintain aspect ratio
//   doc.addImage(
//     logoUrl,
//     "JPEG",
//     (doc.internal.pageSize.width - logoWidth) / 2,
//     10,
//     logoWidth,
//     logoHeight
//   );

//   doc.setFontSize(12);
//   const textWidth = doc.getTextWidth("GS Finance & Leasing Private Limited");
//   doc.text(
//     "GS Finance & Leasing Private Limited",
//     (doc.internal.pageSize.width - textWidth) / 2,
//     20
//   ); // Center text

//   const tableData = [
//     ["Customer Name", emiData.customer_name],
//     ["Loan ID", emiData.customer_loan_id],
//     ["EMI ID", emiData.customer_emi_id],
//     ["EMI Amount", `₹${emiData.collection_amount}`],
//     ["Penalty", `₹${emiData.customer_penalty}`],
//     // Add other relevant rows here
//   ];

//   // Table Generation with Adjustments
//   doc.autoTable({
//     head: [["Item", "Details"]],
//     body: tableData,
//     startY: 35,
//     styles: {
//       font: "helvetica",
//       fontSize: 7,
//       halign: "center",
//       valign: "middle",
//       cellPadding: 2,
//       overflow: "linebreak",
//     },
//     headStyles: {
//       fillColor: [230, 230, 230],
//       halign: "center",
//       valign: "middle",
//     },
//     columnStyles: {
//       0: { cellWidth: "auto" },
//       1: { cellWidth: "wrap" },
//     },
//     didDrawCell: (data) => {
//       if (data.section === "body" && data.column.index === 1) {
//         doc.setTextColor(255, 0, 0);
//       } else {
//         doc.setTextColor(0, 0, 0);
//       }
//     },
//   });

//   // Center the Table
//   const table = doc.lastAutoTable;
//   const tableWidth = table.getWidth();
//   table.xPos = (doc.internal.pageSize.width - tableWidth) / 2;
//   const footerY = doc.autoTable.previous.finalY + 10; // Start footer 10mm below the table
//   doc.setFontSize(8);
//   doc.text("Collection Details: " + emiData.collection_address, 10, footerY);

//   const pdfBuffer = doc.output("arraybuffer");
//   return pdfBuffer;
// }/////
async function generatePDF(emiData) {
  // console.log(emiData);
  const { default: fetch } = await import("node-fetch");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 150], // Adjust size as needed (roughly food bill size)
  });

  // Header (Company Logo & Name)
  const logoUrl =
    "https://androidbucket3577.s3.ap-south-1.amazonaws.com/ic_gs_blue_red.jpeg";
  const logoWidth = 40;
  const logoHeight = (logoWidth * 25) / 60; // Maintain aspect ratio

  // Load the image as base64
  const logoBase64 = await fetch(logoUrl)
    .then((res) => res.buffer())
    .then((buffer) => buffer.toString("base64"));

  doc.addImage(
    `data:image/jpeg;base64,${logoBase64}`,
    "JPEG",
    3, // x coordinate
    5, // y coordinate
    25, // width
    25 // height
  );

  doc.setFontSize(12); // Increase font size
  doc.setFont("helvetica", "bold"); // Set font style to bold
  const text = "GS Finance & Leasing";
  const textWidth = doc.getTextWidth(text);
  doc.text(
    text,
    25,
    18 // Position text below the logo
  );
  doc.text("Private Limited", 25, 24);
  let currentDate = new Date();
  let options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  };
  let formatter = new Intl.DateTimeFormat("en-IN", options);
  let formattedDateTime = formatter.format(currentDate);

  const tableData = [
    ["Customer Name", emiData.fullName],
    ["Loan ID", emiData.userId],
    ["Collection Status", emiData.collection_status || "PENDING"],
    ["EMI Amount", `INR ${emiData.collection_amount || 0}`],
    ["Penalty", `INR ${emiData.customer_penalty || 0}`],
    // Add other relevant rows here
  ];

  // Table Generation with Adjustments
  doc.autoTable({
    head: [["Fields", "Data"]],
    body: tableData,
    startY: 35, // Adjust starting position
    styles: {
      font: "helvetica",
      fontSize: 9, // Adjust font size
      halign: "left", // Align text to the left
      valign: "middle",
      cellPadding: 3, // Adjust cell padding
      overflow: "linebreak",
      fontStyle: "bold",
    },
    headStyles: {
      fillColor: [220, 220, 220], // Change header background color
      textColor: [0, 0, 0], // Change header text color
      halign: "left", // Align header text to the left
      valign: "middle",
    },
    columnStyles: {
      cellWidth: "auto",
    },
    margin: { top: 0, right: 5, bottom: 0, left: 5 },
  });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Date :  " + formattedDateTime, 8, 117);

  // Center the Table
  const table = doc.lastAutoTable;
  const tableWidth = table.getWidth();
  table.xPos = doc.internal.pageSize.width - tableWidth;

  const footerY = table.finalY + 20; // Adjust position below the table
  doc.setFontSize(10); // Adjust font size
  doc.setFont("helvetica"); // Set font style to italic
  doc.text("Employee Signature : " + "____________", 10, footerY + 10);
  //   doc.setFontSize(10); // Adjust font size
  //   doc.setFont("helvetica", "italic"); // Set font style to italic
  //   doc.text("Collection Details: " + emiData.collection_location, 10, footerY);

  const pdfBuffer = doc.output("arraybuffer");
  return pdfBuffer;
}

const createUserCollection = async (req, res) => {
  try {
    const user = await UserData.findById(req.body.userId);
    
    if (user != null) {
      user.totalCollectionAmount = Number(user.totalCollectionAmount)+ Number(req.body.collection_amount)
      await user.save();
      
      uploadMiddleWare.single("file")(req, res, async (err) => {
        if (err) {
          // ... (your error handling for file upload errors)
          res.status(200).json({
            status: "fail",
            code: 200,
            message: "User not found !",
            error: err,
          });
        } else {
          // ... (your existing code to find the user and save the newUserCollection)
          const newUserCollection = new UserCollection(req.body);
          

          newUserCollection.user = req.body.userId;
          newUserCollection.generated_emi_bill = "";
          await newUserCollection.save();

          const pdfBuffer = await generatePDF(req.body);
          const s3Key = `emi_bills/${Date.now()}_${
            req.body.fullName
          }_GS-EMI_bill.pdf`; // Unique name
          await s3.send(
            new PutObjectCommand({
              Bucket: "androidbucket3577",
              Key: s3Key,
              Body: pdfBuffer,
              ContentType: "application/pdf",
              ACL: "public-read",
            })
          );
          const publicUrl = `https://androidbucket3577.s3.ap-south-1.amazonaws.com/${s3Key}`;
          // Get the S3 URL
          // const s3Url = await getS3FileUrl(s3Key);

          // Update the collection with the S3 URL
          newUserCollection.generated_emi_bill = publicUrl;
          await newUserCollection.save();
          // ... rest of your code
          res.status(200).json({
            status: "success",
            code: 200,
            message: "User Collection Recorded Successfully !",
            data: newUserCollection,
          });
        }
      });
    } else {
      res.status(200).json({
        status: "fail",
        code: 200,
        message: "User not found !",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(200).json({
      status: "fail",
      code: 500,
      message: "Internal Server Error",
    });
  }
};

///////////////////////////Rishi//////////////////////////////
//New to sort month
const getLeadsByCurrentMonth = async (req, res) => {
  try {
    const { month } = req.body;

    // Validate month input
    if (!month || isNaN(month)) {
      return res.status(200).json({
        status: "Failed",
        code: 400,
        message: "Please provide a valid month.",
      });
    }

    // Get the current year
    const currentYear = new Date().getFullYear();

    // Parse month and current year into a Date object
    const fromDate = new Date(currentYear, month - 1, 1); // Month is zero-based in JavaScript
    const toDate = new Date(currentYear, month, 0); // Get the last day of the month

    // Find leads within the specified date range
    const leads = await UserLead.find({
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    });
    if (leads.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Lead found",
      });
    }

    res.json({
      status: "success",
      code: 200,
      message: "leads-by-current-month",
      data: leads,
    });
  } catch (error) {
    res.status(200).json({
      status: "Failed",
      code: 500,
      message: error.message,
    });
  }
};
//Filter on approve lead by Date
const getApproveLeadByDate = async (req, res) => {
  try {
    const { fromDate, toDate, firstName } = req.body;

    // Parse the dates from YYYY-MM-DD format
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Set the 'to' date to the end of the day
    to.setHours(23, 59, 59, 999);
    let query = {
      createdAt: {
        $gte: from,
        $lte: to,
      },
    };
    // Add firstName filter using regex if provided
    if (firstName) {
      query.firstName = { $regex: firstName, $options: "i" }; // 'i' makes it case-insensitive
    }

    const loans = await LoanApproveModel.find(query).populate("user");

    if (loans.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Approved Loan found",
      });
    }

    res.json({
      status: "success",
      code: 200,
      message: "filtered-Approved-loans",
      data: loans,
    });
  } catch (error) {
    res.json({
      status: "Failed",
      code: 500,
      message: error.message,
    });
  }
};
const getApproveLeadsByMonth = async (req, res) => {
  try {
    const { month } = req.body;

    // Validate month input
    if (!month || isNaN(month)) {
      return res.status(200).json({
        status: "Failed",
        code: 400,
        message: "Please provide a valid month.",
      });
    }

    // Get the current year
    const currentYear = new Date().getFullYear();

    // Parse month and current year into a Date object
    const fromDate = new Date(currentYear, month - 1, 1); // Month is zero-based in JavaScript
    const toDate = new Date(currentYear, month, 0); // Get the last day of the month

    // Find leads within the specified date range
    const leads = await LoanApproveModel.find({
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    });
    if (leads.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Approve Lead found",
      });
    }

    res.json({
      status: "success",
      code: 200,
      message: "Approve Lead found for current-month",
      data: leads,
    });
  } catch (error) {
    res.status(200).json({
      status: "Failed",
      code: 500,
      message: error.message,
    });
  }
};
const getDisburseLeadByDate = async (req, res) => {
  try {
    const { fromDate, toDate, firstName } = req.body;

    // Parse the dates from YYYY-MM-DD format
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Set the 'to' date to the end of the day
    to.setHours(23, 59, 59, 999);
    let query = {
      createdAt: {
        $gte: from,
        $lte: to,
      },
    };
    // Add firstName filter using regex if provided
    if (firstName) {
      query.firstName = { $regex: firstName, $options: "i" }; // 'i' makes it case-insensitive
    }

    const loans = await LoanDisburseModel.find(query);

    if (loans.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Disbursed Loan found",
      });
    }

    res.json({
      status: "success",
      code: 200,
      message: "filtered-Disbursed-loans",
      data: loans,
    });
  } catch (error) {
    res.json({
      status: "Failed",
      code: 500,
      message: error.message,
    });
  }
};
const getDisburseLeadsByMonth = async (req, res) => {
  try {
    const { month } = req.body;

    // Validate month input
    if (!month || isNaN(month)) {
      return res.status(200).json({
        status: "Failed",
        code: 400,
        message: "Please provide a valid month.",
      });
    }

    // Get the current year
    const currentYear = new Date().getFullYear();

    // Parse month and current year into a Date object
    const fromDate = new Date(currentYear, month - 1, 1); // Month is zero-based in JavaScript
    const toDate = new Date(currentYear, month, 0); // Get the last day of the month

    // Find leads within the specified date range
    const leads = await LoanDisburseModel.find({
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    });
    if (leads.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Disburse Lead found",
      });
    }

    res.json({
      status: "success",
      code: 200,
      message: "Disburse Lead found for current-month",
      data: leads,
    });
  } catch (error) {
    res.status(200).json({
      status: "Failed",
      code: 500,
      message: error.message,
    });
  }
};
const getRejectedLeadByDate = async (req, res) => {
  try {
    const { fromDate, toDate, firstName } = req.body;

    // Parse the dates from YYYY-MM-DD format
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Set the 'to' date to the end of the day
    to.setHours(23, 59, 59, 999);
    let query = {
      createdAt: {
        $gte: from,
        $lte: to,
      },
    };
    // Add firstName filter using regex if provided
    if (firstName) {
      query.firstName = { $regex: firstName, $options: "i" }; // 'i' makes it case-insensitive
    }

    const loans = await LoanRejectedModel.find(query);
    if (loans.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Rejected Loan found",
      });
    }

    res.json({
      status: "success",
      code: 200,
      message: "filtered-Rejected-loans",
      data: loans,
    });
  } catch (error) {
    res.json({
      status: "Failed",
      code: 500,
      message: error.message,
    });
  }
};
const getRejectedLeadsByMonth = async (req, res) => {
  try {
    const { month } = req.body;

    // Validate month input
    if (!month || isNaN(month)) {
      return res.status(200).json({
        status: "Failed",
        code: 400,
        message: "Please provide a valid month.",
      });
    }

    // Get the current year
    const currentYear = new Date().getFullYear();

    // Parse month and current year into a Date object
    const fromDate = new Date(currentYear, month - 1, 1); // Month is zero-based in JavaScript
    const toDate = new Date(currentYear, month, 0); // Get the last day of the month

    // Find leads within the specified date range
    const leads = await LoanRejectedModel.find({
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    });
    if (leads.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Rejected Lead found",
      });
    }

    res.json({
      status: "success",
      code: 200,
      message: "Rejected Lead found for current-month",
      data: leads,
    });
  } catch (error) {
    res.status(200).json({
      status: "Failed",
      code: 500,
      message: error.message,
    });
  }
};
const getOngoingLeadByDate = async (req, res) => {
  try {
    const { fromDate, toDate, firstName } = req.body;

    // Parse the dates from YYYY-MM-DD format
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Set the 'to' date to the end of the day
    to.setHours(23, 59, 59, 999);
    let query = {
      createdAt: {
        $gte: from,
        $lte: to,
      },
    };
    // Add firstName filter using regex if provided
    if (firstName) {
      query.firstName = { $regex: firstName, $options: "i" }; // 'i' makes it case-insensitive
    }

    const loans = await LoanOngoingModel.find(query);

    if (loans.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Ongoing Loan found",
      });
    }

    res.json({
      status: "success",
      code: 200,
      message: "filtered-Ongoing-loans",
      data: loans,
    });
  } catch (error) {
    res.json({
      status: "Failed",
      code: 500,
      message: error.message,
    });
  }
};
const getOngoingLeadsByMonth = async (req, res) => {
  try {
    const { month } = req.body;

    // Validate month input
    if (!month || isNaN(month)) {
      return res.status(200).json({
        status: "Failed",
        code: 400,
        message: "Please provide a valid month.",
      });
    }

    // Get the current year
    const currentYear = new Date().getFullYear();

    // Parse month and current year into a Date object
    const fromDate = new Date(currentYear, month - 1, 1); // Month is zero-based in JavaScript
    const toDate = new Date(currentYear, month, 0); // Get the last day of the month

    // Find leads within the specified date range
    const leads = await LoanOngoingModel.find({
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    });
    if (leads.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Ongoing Lead found",
      });
    }

    res.json({
      status: "success",
      code: 200,
      message: "Ongoing Lead found for current-month",
      data: leads,
    });
  } catch (error) {
    res.status(200).json({
      status: "Failed",
      code: 500,
      message: error.message,
    });
  }
};
const getclosedLeadByDate = async (req, res) => {
  try {
    const { fromDate, toDate, firstName } = req.body;

    // Parse the dates from YYYY-MM-DD format
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Set the 'to' date to the end of the day
    to.setHours(23, 59, 59, 999);
    let query = {
      createdAt: {
        $gte: from,
        $lte: to,
      },
    };
    // Add firstName filter using regex if provided
    if (firstName) {
      query.firstName = { $regex: firstName, $options: "i" }; // 'i' makes it case-insensitive
    }
    const loans = await LoanClosedModel.find(query);

    if (loans.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Closed Loan found",
      });
    }

    res.json({
      status: "success",
      code: 200,
      message: "filtered-Closed-loans",
      data: loans,
    });
  } catch (error) {
    res.json({
      status: "Failed",
      code: 500,
      message: error.message,
    });
  }
};
const getClosedLeadsByMonth = async (req, res) => {
  try {
    const { month } = req.body;

    // Validate month input
    if (!month || isNaN(month)) {
      return res.status(200).json({
        status: "Failed",
        code: 400,
        message: "Please provide a valid month.",
      });
    }

    // Get the current year
    const currentYear = new Date().getFullYear();

    // Parse month and current year into a Date object
    const fromDate = new Date(currentYear, month - 1, 1); // Month is zero-based in JavaScript
    const toDate = new Date(currentYear, month, 0); // Get the last day of the month

    // Find leads within the specified date range
    const leads = await LoanClosedModel.find({
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    });
    if (leads.length === 0) {
      return res.status(200).json({
        status: "Failed",
        code: 404,
        message: "No Closed Lead found",
      });
    }

    res.json({
      status: "success",
      code: 200,
      message: "Closed Lead found for current-month",
      data: leads,
    });
  } catch (error) {
    res.status(200).json({
      status: "Failed",
      code: 500,
      message: error.message,
    });
  }
};
//////////////////////////////////////////////////
const getAllUserLeads = async (req, res) => {
  try {
    const userLead = await UserLead.find({ user: req.body.userId }).sort({
      createdAt: -1,
    });
    if (userLead.length != 0) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "User Leads Fetched successfully !",
        data: userLead,
      });
    } else {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No User Leads found !" });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getAllUserVisits = async (req, res) => {
  try {
    const userLead = await UserVisit.find({ user: req.body.userId });
    if (userLead.length != 0) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "User Visits Fetched successfully !",
        data: userLead,
      });
    } else {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No User Visits found !" });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, message: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getAllVisits = async (req, res) => {
  try {
    const userLead = await UserVisit.find()
      .sort({ createdAt: -1 })
      .populate("user");
    if (userLead != null && userLead.length != 0) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Visit Fetched successfully !",
        data: userLead,
      });
    } else {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No Visit found !" });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getAllOnGoingLoans = async (req, res) => {
  try {
    const userLead = await LoanOngoingModel.find();
    if (userLead != null && userLead.length != 0) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "On-going Loans fetched successfully !",
        data: userLead,
      });
    } else {
      return res.status(200).json({
        status: "fail",
        code: 400,
        message: "No On-Going Loans found !",
      });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getAllRejectedLoans = async (req, res) => {
  try {
    const userLead = await LoanRejectedModel.find();
    if (userLead != null && userLead.length != 0) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Rejected Loans fetched successfully !",
        data: userLead,
      });
    } else {
      return res.status(200).json({
        status: "fail",
        code: 400,
        message: "No Rejected Loans found !",
      });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllClosedLoan = async (req, res) => {
  try {
    const userLead = await LoanClosedModel.find();
    if (userLead != null && userLead.length != 0) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Closed Loans fetched successfully !",
        data: userLead,
      });
    } else {
      return res.status(200).json({
        status: "fail",
        code: 400,
        message: "No Closed Loans found !",
      });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// controller function to get-user-attendance.
const getUserAttendance = async (req, res) => {
  try {
    const { userId } = req.body;
    const userAttendence = await UserAttendance.find({ user: userId });
    if (userAttendence.length != 0) {
      res.status(200).json({
        status: "success",
        code: 200,
        message: "User attendance fetched successfully !",
        data: userAttendence,
      });
    } else {
      res
        .status(200)
        .json({ status: "fail", code: 500, message: "Internal Server Error" });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, message: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// controller function to delete-attendance.
const deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.body;
    const userLead = await UserAttendance.findByIdAndDelete(attendanceId);
    saveToRecycleBin(JSON.stringify(userLead), "ATTENDANCE");

    if (userLead != null) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Attendance Deleted successfully !",
      });
    } else {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No Attendance found !" });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteRejectedLoan = async (req, res) => {
  try {
    const { rejected_loan_id } = req.body;
    const userLead = await LoanRejectedModel.findByIdAndDelete(
      rejected_loan_id
    );
    saveToRecycleBin(JSON.stringify(userLead), "LOAN_REJECTED");

    if (userLead != null) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Loan Rejected Deleted successfully !",
      });
    } else {
      return res.status(200).json({
        status: "fail",
        code: 400,
        message: "No Rejected Loan found !",
      });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteClosedLoan = async (req, res) => {
  try {
    const { rejected_loan_id } = req.body;
    const userLead = await LoanClosedModel.findByIdAndDelete(rejected_loan_id);
    saveToRecycleBin(JSON.stringify(userLead), "LOAN_CLOSED");

    if (userLead != null) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Loan Closed Deleted successfully !",
      });
    } else {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No Closed Loan found !" });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const deleteOnGoingLoan = async (req, res) => {
  try {
    const { ongoing_loan_id } = req.body;
    const userLead = await LoanOngoingModel.findByIdAndDelete(ongoing_loan_id);
    saveToRecycleBin(JSON.stringify(userLead), "LOAN_ONGOING");

    if (userLead != null) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "Loan On-going Deleted successfully !",
      });
    } else {
      return res.status(200).json({
        status: "fail",
        code: 400,
        message: "No On-going Loan found !",
      });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// controller function to get-all-attendance.
const getAllAttendance = async (req, res) => {
  try {
    const allAttendance = await UserAttendance.find()
      .sort({ createdAt: -1 })
      .populate("user");
    if (allAttendance.length != 0) {
      return res.status(200).json({
        status: "success",
        code: 200,
        message: "All attendance record",
        data: allAttendance,
      });
    } else {
      return res
        .status(200)
        .json({ status: "fail", code: 200, message: "No attendance found" });
    }
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// controller function to create-attendance.
const createAttendance = async (req, res) => {
  try {
    const { userId } = req.body;

    const newAttendance = new UserAttendance(req.body);
    newAttendance.user = userId;

    // Save the lead to the database
    const savedLead = await newAttendance.save();

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "Created Attendance successfully",
      data: savedLead,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// controller function to create-visit

const createVisit = async (req, res) => {
  try {
    const { userId } = req.body;

    const newVisit = new UserVisit(req.body);
    newVisit.user = userId;

    // Save the lead to the database
    const savedLead = await newVisit.save();

    return res.status(200).json({
      status: "success",
      code: 200,
      message: "Created Visit successfully",
      data: savedLead,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof mongoose.Error.CastError) {
      return res
        .status(200)
        .json({ status: "fail", code: 200, error: "Invalid user ID format" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId, fullName, telephoneNumber, mPass, empId } = req.body;

    // 1. Find the user to update
    const user = await UserData.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: "404",
        code: 404,
        message: "User not found",
      });
    }

    // 2. Check for duplicate phone number (if changing)
    if (
      telephoneNumber &&
      telephoneNumber !== user.telephoneNumber &&
      (await UserData.findOne({ telephoneNumber }))
    ) {
      return res.status(400).json({
        status: "400",
        code: 400,
        message: "Mobile number already exists",
      });
    }

    // 3. Update user fields
    user.fullName = fullName || user.fullName; // Update only if provided
    user.telephoneNumber = telephoneNumber || user.telephoneNumber;
    user.mpass = mPass;
    user.employeeId = empId;

    // 4. Save the updated user
    const updatedUser = await user.save();

    res.status(200).json({
      status: "200",
      code: 200,
      message: "User updated successfully!",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controller function for user registration

const registerUser = async (req, res) => {
  try {
    // Extract data from the request body
    const { fullName, telephoneNumber } = req.body;

    const existingUser = await UserData.findOne({ telephoneNumber });
    if (existingUser) {
      res.status(200).json({
        status: "400",
        code: 400,
        message: "Mobile number already exists",
      });
    }

    const mpass = makeid(5);
    const employeeId = "GS" + makeidNumber(4);

    // Create a new user document in the database
    const newUserData = new UserData({
      fullName,
      telephoneNumber,
      employeeId,
      mpass,
    });
    const savedUserData = await newUserData.save();

    // Send a success response with the created user data
    res.status(200).json({
      status: "200",
      code: 200,
      message: "User created successfully!",
      data: savedUserData,
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
    const passwordMatch = (user.mpass = req.body.mpass);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Successful login: Optionally generate a JWT token for future requests
    // ... (add JWT logic if needed)

    res.status(200).json({
      status: "200",
      code: 200,
      message: "Login successful!",
      data: user, // Send relevant user data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateEmiPayment = async (req, res) => {
  try {
    const { emi_id, payment_id, paymentStatus } = req.body;
    const emi = await EmiPaymentSchedule.findById(emi_id);

    if (emi) {
      const payment = emi.payments.id(payment_id);

      if (payment) {
        payment.paymentStatus = paymentStatus;
        payment.paymentDate = new Date();
        await emi.save();

        return res.status(200).json({
          code: 200,
          status: "success",
          message: "Emi Payment Updated Successfully",
          data: emi,
        });
      } else {
        return res.status(200).json({
          code: 404,
          status: "fail",
          message: "Payment record not found!",
        });
      }
    } else {
      return res.status(200).json({
        code: 404,
        status: "fail",
        message: "Emi Payment Schedule not found!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      code: 500,
      status: "error",
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updateMpass,
  createLead,
  getAllLeads,
  updateLeadStatus,
  getAllUsers,
  deleteLead,
  deleteUser,
  getAllUserLeads,
  getAllVisits,
  getUserAttendance,
  getAllUserApprovedLeads,
  createAttendance,
  updateLoanApprovalStatus,
  updateDisbursalLoanStatus,

  getAllDisburmentLoans,
  getAllOnGoingLoans,

  deleteDisbursalLoan,
  getDisbursalLoanDetail,
  deleteOnGoingLoan,
  getOngoingLoanDetail,

  deleteRejectedLoan,
  getAllUserTotalAmount,
  calculateTotals,

  getAllRejectedLoans,
  getClosedLoanDetails,
  closeOnGoingLoan,
  getLeadEmi,
  uploadFile,
  getAllApprovalLoans,
  deleteApprovalLoan,
  deleteAttendance,
  uploadLeadCibilPdf,
  getLeadDetails,
  getRejectedDetails,

  getLoanApprovalDetails,
  getAllRecycleBins,
  getAllClosedLoan,
  deleteClosedLoan,
  updateAmountFields,

  updateEmpLead,
  checkUniqueLead,

  getAllUserVisits,
  getAllAttendance,
  ongoingEmiDetail,

  createVisit,
  deleteVisit,
  updateEmiPayment,
  searchUserLeads,
  searchUserLeadsByDate,
  searchUserLeadsByStatus,
  getLeadsByDateAndStatusName,
  getLeadsByCurrentMonth,
  getApproveLeadByDate,
  getApproveLeadsByMonth,
  getDisburseLeadByDate,
  getDisburseLeadsByMonth,
  getRejectedLeadByDate,
  getRejectedLeadsByMonth,
  getOngoingLeadByDate,
  getOngoingLeadsByMonth,
  getclosedLeadByDate,
  getClosedLeadsByMonth,
  createUserCollection,
  updateUserCollection,
  deleteUserCollection,
  getUserCollection,
  updateUser,
  createLeadCard,
  deleteLeadCard,
  getAllLeadCards,
  getAdminDashboard,
  getCurrentMonthLeadsUser,
  updateUserCollectionAmount,
  getApprovedCollections,
  getRejectedCollections,






};
