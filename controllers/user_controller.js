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
const RecycleBin = require("../models/recycler_bin");
const LoanClosedModel = require("../models/loan_closed_model");
const EmiPaymentSchedule = require("../models/emi_payment_schedule");

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
      res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
          error: "Incorrect current password",
          status: "fail",
          code: 400,
        });
    }

    user.mpass = newMpass; // Update the password directly
    await user.save();

    res
      .status(200)
      .json({
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
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
          status: "fail",
          code: 400,
          message: "No recycler data found !",
        });
    } else {
      return res
        .status(200)
        .json({
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

      return res
        .status(200)
        .json({
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

// controller function to get-all-users
const getAllUsers = async (req, res) => {
  try {
    const allUsers = await UserData.find().sort({ createdAt: -1 });
    if (allUsers.length == 0) {
      return res
        .status(200)
        .json({ status: "fail", code: 400, message: "No users found !" });
    } else {
      return res
        .status(200)
        .json({
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
    const allLeads = await LoanDisburseModel.find().sort({ createdAt: -1 }).populate("user");
    if (allLeads.length == 0) {
      res
        .status(200)
        .json({ status: "fail", code: 400, message: "No Disbursed Loans" });
    } else {
      res
        .status(200)
        .json({
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
    const allLeads = await LoanApproveModel.find().sort({ createdAt: -1 }).populate("user");
    if (allLeads.length == 0) {
      res
        .status(200)
        .json({ status: "fail", code: 400, message: "No Approved Loans" });
    } else {
      res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
          status: "success",
          code: 200,
          message: "Deleted Disbursal Loan successfully !",
        });
    } else {
      return res
        .status(200)
        .json({
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
        res
          .status(200)
          .json({
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

        res
          .status(200)
          .json({
            status: "success",
            code: 200,
            message: "Loan Approval Table updated successfully ",
            data: userLead,
          });
      } else {
        userLead.lead_status = status;
        await userLead.save();
        res
          .status(200)
          .json({
            status: "success",
            code: 200,
            message: "Loan Approval Table updated successfully ",
            data: userLead,
          });
      }
    } else {
      res
        .status(200)
        .json({
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
          res
            .status(200)
            .json({
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

          res
            .status(200)
            .json({
              status: "success",
              code: 200,
              message: "Loan Approval Table updated successfully ",
              data: userLead,
            });
        } else {
          userLead.lead_status = status;
          await userLead.save();
          res
            .status(200)
            .json({
              status: "success",
              code: 200,
              message: "Loan Approval Table updated successfully ",
              data: userLead,
            });
        }
      } else {
        res
          .status(200)
          .json({
            status: "fail",
            code: 400,
            message: "Ongoing-Loan Already present in Closed Loan Table",
            data: userLead,
          });
      }
    } else {
      res
        .status(200)
        .json({
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

    const existingLead = await UserLead.findOne({
      $or: [
        { mobileNumber: number },
        { panCard: pancard },
        { aadhar_card: aadhar }
      ]
    });

    if (!existingLead) {
      res.status(200).json({
        message: "New Lead Found",
        status: "success",
        code: 200
      });
    } else {
      res.status(200).json({ 
        message: "Lead already exists", 
        status: "fail", 
        code: 400 
      });
    }
  } catch (error) {
    console.error("Error checking for unique lead:", error);
    res.status(200).json({
      message: "Internal server error",
      status: "error",
      code: 500
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
      res
        .status(200)
        .json({
          status: "success",
          code: 200,
          message: "Update of Amount in APPROVAL AND EMP-LEAD TABLE",
        });
    } else {
      res
        .status(200)
        .json({
          status: "fail",
          code: 400,
          message: "Approval Loan or Lead Employee not found in Database. ",
          data: userLead,
        });
    }
  } catch (error) {
    console.log(error);
    res
      .status(200)
      .json({
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
                message: "EMI Payment ID is required."
            });
        }

        const emiSchedule = await EmiPaymentSchedule.findById(emi_payment_id);

        if (!emiSchedule) {
            return res.status(404).json({
                status: "error",
                code: 404,
                message: "EMI Schedule not found."
            });
        }

        let totalAmountPaid = 0;
        let totalAmountUnpaid = 0;

        for (const payment of emiSchedule.payments) {
            const amount = payment.principalAmount + payment.interestAmount;
            if (payment.paymentStatus === 'paid') {
                totalAmountPaid += amount;
            } else {
                totalAmountUnpaid += amount;
            }
        }

        return res.status(200).json({
            status: "success",
            code: 200,
            message: "EMI Amount Detail.",
            totalUnpaid: totalAmountUnpaid,
            totalPaid: totalAmountPaid
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            code: 500,
            message: "Error calculating totals: " + error.message
        });
    }
};


// controller function to update-loan-approval
const updateLoanApprovalStatus = async (req, res) => {
  try {
    const { loan_approval_id, status, amount, feesAmount, interestRate,emi_tenure,disbursement_date,emi_first_date } =
      req.body;

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
      res
        .status(200)
        .json({
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
            res
              .status(200)
              .json({
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
                loanId : newOngoingLoan._id,
                totalLoanAmount : totalAmount.toString(),
                interestRate : interestRate,
                totalInterest : totalInterest.toString(),
                monthlyInterest : monthlyInterest,

                loanTenureMonths : emi_tenure,
                startDate : Date.now(),
                emiAmount : EMI.toString(),
                paymentFrequency : 'monthly',
                payments : emiPaymentArray,

            });
        
           await  emiPaymentSchedule.save();

              return res
                .status(200)
                .json({
                  status: "success",
                  code: 200,
                  message:
                    "Approval Loan Updated updated successfully & Loan is Moved to Disbursal Table "+emiPaymentSchedule._id,
                  data: userLead,
                });
            } else {
              return res
                .status(200)
                .json({
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
            res
              .status(200)
              .json({
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

              res
                .status(200)
                .json({
                  status: "success",
                  code: 200,
                  message:
                    "Approval Loan Updated updated successfully & Loan is Moved to Rejected Table ",
                  data: userLead,
                });
            } else {
              res
                .status(200)
                .json({
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
          res
            .status(200)
            .json({
              status: "success",
              code: 200,
              message: "Loan Approval Table updated successfully ",
              data: userLead,
            });
        }
      } else {
        res
          .status(200)
          .json({
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
  
    const EMI = (P + (P * R * N)) / N;
  
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
        paymentStatus: 'pending'
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
          res
            .status(200)
            .json({
              status: "success",
              code: 200,
              approval_loan_id: newApprovalLoan._id,
              message:
                "Lead updated successfully & Lead is Moved to Approval Table ",
              data: userLead,
            });
        } else {
          res
            .status(200)
            .json({
              status: "fail",
              code: 400,
              message: "Lead is Already Present in Approval Table",
            });
        }
      } else if (status === "DISBURSED") {
        userLead.disbursementDate = Date.now();
        userLead.lead_status = status;
        await userLead.save();

        res
          .status(200)
          .json({
            status: "success",
            code: 200,
            message: "Lead updated successfully ",
            data: userLead,
          });
      } else {
        userLead.lead_status = status;
        await userLead.save();
        res
          .status(200)
          .json({
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
const getAllLeads = async (req, res) => {
  try {
    
    const allLeads = await UserLead.find().sort({ createdAt: -1 }).populate("user");
    console.log(allLeads); // Log the raw results to check the order


    if (allLeads.length == 0) {
      res
        .status(200)
        .json({ status: "fail", code: 200, error: "No Leads Exists" });
    } else {
      res
        .status(200)
        .json({
          status: "success",
          code: 200,
          message: "all-admin-xxx",
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
const getDisbursalLoanDetail = async (req, res) => {
  try {
    const { disbursal_loan_id } = req.body;

    const lead = await LoanDisburseModel.findById(disbursal_loan_id);
    if (lead != null) {
      return res
        .status(200)
        .json({
          code: 200,
          status: "success",
          message: "Record Found !",
          data: lead,
        });
    } else {
      return res
        .status(200)
        .json({
          code: 400,
          status: "fail",
          message: "Disbursal Loan Not Found not found",
        });
    }
  } catch (error) {
    console.log(error);
  }
};

const ongoingEmiDetail = async (req,res) => {
    try {
        const { ongoing_loan_id } = req.body;
    
        const lead = await EmiPaymentSchedule.find({loanId : ongoing_loan_id});
        if (lead != null) {
          return res
            .status(200)
            .json({
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





}



const getOngoingLoanDetail = async (req, res) => {
  try {
    const { ongoing_loan_id } = req.body;

    const lead = await LoanOngoingModel.findById(ongoing_loan_id);
    if (lead != null) {
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
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

const getLeadEmi = async (req,res) => {

  try{
    const {leadId,emi_tenure} = req.body;
    const lead = await UserLead.findById(leadId);
    if(lead){
      const P = parseFloat(lead.leadAmount);
      const R = parseFloat(lead.lead_interest_rate) / 100 / 12; // Monthly interest rate
      const N = parseFloat(emi_tenure);

      // Flat EMI Calculation
      const monthlyInterest = P * R;
      const totalInterest = monthlyInterest * N;
      const EMI = (P + totalInterest) / N;
      const totalAmount = EMI * N;
      console.log(req.body);
     
      return res
        .status(200)
        .json({
          code: 200,
          status: "success",
          message: "Emi Details",
          monthly_interest : monthlyInterest,
          total_interest : totalInterest,
          emi_amount : EMI,
          total_amount : totalAmount,
          payment_array : emiPaymentArray
        });

    }else{
      return res
        .status(200)
        .json({ code: 400, status: "fail", message: "Lead not found" });
    }

   
  }catch(error){
    console.log(error);
  }


}
// controller function to get-lead-by-id
const getLeadDetails = async (req, res) => {
  try {
    const { leadId } = req.body;

    const lead = await UserLead.findById(leadId);
    if (lead != null) {
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
          code: 200,
          status: "success",
          message: "Record Found !",
          data: lead,
        });
    } else {
      return res
        .status(200)
        .json({
          code: 400,
          status: "fail",
          message: "Loan Approval not found",
        });
    }
  } catch (error) {
    console.log(error);
  }
};

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
    

    if (existingLead.length != 0) {
      return res
        .status(200)
        .json({ code: "200", status: "fail", error: "Lead Alredy Exists" });
    }

    // Create a new UserLead document
    const newLead = new UserLead(req.body);
    newLead.user = userId;
    newLead.generated_loan_id = 'GS-LOAN-'+leadCount.length+1;

    // const initialCounter = new Counter({ _id: 'userLeadId', seq: 0 });
    // await initialCounter.save();
    // Save the lead to the database
    const savedLead = await newLead.save();

    return res.status(201).json({
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
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
          status: "success",
          code: 200,
          message: "Approval Loan Deleted successfully !",
        });
    } else {
      return res
        .status(200)
        .json({
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

const getAllUserApprovedLeads = async (req,res) => {
  
  try {
    const userLead = await UserLead.find({ user: req.body.userId, lead_status : 'APPROVED' });
    if (userLead.length != 0) {
      return res
        .status(200)
        .json({
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


}

const searchUserLeadsByDate = async(req,res) => {


  try {
    const { userId, fromDate, toDate } = req.body;

    // Date Validation (Ensure valid date formats)
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });
    }

    // Query Logic
    const leads = await UserLead.find({
        user: userId,
        createdAt: {
            $gte: startDate,   // Greater than or equal to fromDate
            $lte: endDate,    // Less than or equal to toDate
        },
    });

    res.json({status : 'success',code : 200,message : 'User-Filtered-Leads-Date',data : leads});
} catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
}

}

const searchUserLeads = async (req,res) => {


  try {
    const userId = req.body.userId;
    const queryText = req.body.queryText;

    // Search Logic (Case-Insensitive)
    const leads = await UserLead.find({
        user: userId,
        $or: [
            { firstName: { $regex: queryText, $options: 'i' } }, // Case-insensitive search
        ],
    });

    res.json({status : 'success',code : 200, message : 'User-Filtered-Leads-Text',data : leads});
} catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
}


}
const searchUserLeadsByStatus = async (req,res) => {
  try {
    const { userId, status } = req.body;

    // Input Validation (Optional but recommended)
    if (!userId || !status) {
        return res.status(400).json({ error: 'userId and status are required' });
    }
    if (!['EMPTY','PENDING','APPROVED','REJECTED','DISBURSED'].includes(status)){
        return res.status(400).json({ error: 'Invalid status value'});
    }

    // Query Logic
    const leads = await UserLead.find({
        user: userId,
        lead_status: status,
    });

    res.json({status : 'success',code : 200, message : 'User-Filtered-Leads-Status',data : leads});
} catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
}



}

const getLeadsByDateAndStatusName = async (req, res) => {
  try {
      const { fromDate, toDate, leadStatus,leadFirstName } = req.body;
      console.log(req.body);
      

      // Input Validation
      if (!fromDate || !toDate || !leadStatus) {
          return res.status(400).json({ error: 'Missing required parameters: fromDate, toDate, leadStatus' });
      }

      // Query Construction
      const query = UserLead.find({
          createdAt: {
              $gte: new Date(fromDate), 
              $lte: new Date(toDate)    
          },
          lead_status: leadStatus,
          firstName : leadFirstName       
      });

      const filteredLeads = await query.exec();
      res.json(filteredLeads);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};


const getAllUserLeads = async (req, res) => {
  try {
    const userLead = await UserLead.find({ user: req.body.userId }).sort({ createdAt: -1 });
    if (userLead.length != 0) {
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
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
    const userLead = await UserVisit.find().sort({ createdAt: -1 }).populate("user");
    if (userLead != null && userLead.length != 0) {
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
          status: "success",
          code: 200,
          message: "On-going Loans fetched successfully !",
          data: userLead,
        });
    } else {
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
          status: "success",
          code: 200,
          message: "Rejected Loans fetched successfully !",
          data: userLead,
        });
    } else {
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
          status: "success",
          code: 200,
          message: "Closed Loans fetched successfully !",
          data: userLead,
        });
    } else {
      return res
        .status(200)
        .json({
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
      res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
          status: "success",
          code: 200,
          message: "Loan Rejected Deleted successfully !",
        });
    } else {
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
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
      return res
        .status(200)
        .json({
          status: "success",
          code: 200,
          message: "Loan On-going Deleted successfully !",
        });
    } else {
      return res
        .status(200)
        .json({
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
    const allAttendance = await UserAttendance.find().sort({ createdAt: -1 }).populate("user");
    if (allAttendance.length != 0) {
      return res
        .status(200)
        .json({
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

    return res
      .status(200)
      .json({
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

    return res
      .status(200)
      .json({
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
  searchUserLeads,
  searchUserLeadsByDate,
  searchUserLeadsByStatus,
  getLeadsByDateAndStatusName

};
