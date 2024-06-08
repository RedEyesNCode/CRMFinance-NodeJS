const mongoose = require("mongoose");



mongoose
  // .connect("mongodb://3.111.135.18:27017/CRMFinanceNodejs")
  .connect("mongodb://localhost:27017/CRMFinanceNodejs")
  .then(async () => {
    console.log("Database connected!");
    
  })
  .catch((err) => console.error("Error connecting to database:", err));
