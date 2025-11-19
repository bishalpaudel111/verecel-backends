const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const Admin = require("./models/Admin"); 

const MONGO_URI = "mongodb://127.0.0.1:27017/Online_Food_Order_Datas"; 

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    const password = await bcrypt.hash("ajaystha", 10);
    await Admin.create({ name: "Admin", email: "ajaystha@gmail.com", password, role: "admin" });
    console.log("Admin created");
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

createAdmin();
