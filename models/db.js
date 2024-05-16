const mongoose = require("mongoose");



mongoose
  .connect("mongodb://127.0.0.1:27017/CRMFinanceNodejs")
  .then(async () => {
    console.log("Database connected!");
    
  })
  .catch((err) => console.error("Error connecting to database:", err));
