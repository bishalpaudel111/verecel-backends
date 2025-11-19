
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
// const Image = require("../models/Image");
// const User = require("../models/User");

// const generateToken = (userId) => {
//   return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
// };

// exports.uploadImage = async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   const imagePath = `/uploads/profileImages/${req.file.filename}`;

//   const user = await User.findByIdAndUpdate(
//     req.user.id,
//     { profileImage: imagePath },
//     { new: true }
//   );

//   await Image.create({
//     userId: req.user.id,
//     imagePath,
//   });

//   res.json({ profileImage: imagePath });
// };


// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, address } = req.body;

//     const existing = await User.findOne({ email });
//     if (existing) return res.status(400).json({ message: "User already exists" });

//     const hashed = await bcrypt.hash(password, 10);
//     const user = await User.create({ name, email, password: hashed, address });

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your_jwt_secret", {
//       expiresIn: "7d",
//     });

//     res.json({
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         address: user.address,
//         token, 
//       },
//     });
//   } catch (err) {
//     console.error("Register Error:", err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// exports.resetPassword = async (req, res) => {
//   const { currentPassword, newPassword } = req.body;
//   const user = await User.findById(req.user.id);

//   const isMatch = await bcrypt.compare(currentPassword, user.password);
//   if (!isMatch)
//     return res.status(400).json({ message: "Incorrect password" });

//   user.password = await bcrypt.hash(newPassword, 10);
//   await user.save();
//   res.json({ message: "Password updated" });
// };

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "User not found" });

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(400).json({ message: "Invalid password" });

//     const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

//     res.json({
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         address: user.address,
//         token,   
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// exports.getProfile = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select("-password");
//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json(user);
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// };


// controllers/userController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const User = require("../models/User");
const Image = require("../models/Image");

const OTP_LENGTH = 6;
const OTP_EXPIRES_MIN = 15; // minutes

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
};

const createTransporter = () => {
  // uses env EMAIL_USER and EMAIL_PASS
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const generateOTP = () => {
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) otp += Math.floor(Math.random() * 10);
  return otp;
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imagePath = `/uploads/profileImages/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: imagePath },
      { new: true }
    );

    await Image.create({
      userId: req.user.id,
      imagePath,
    });

    res.json({ profileImage: imagePath });
  } catch (err) {
    console.error("uploadImage error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);

    const user = await User.create({
      name,
      email,
      password: hashed,
      address,
      phone,
      isVerified: false,
      otpHash,
      otpExpires,
    });

    // send OTP email (inline using nodemailer)
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your verification code",
        text: `Hello ${name},\n\nYour verification code is: ${otp}\nIt will expire in ${OTP_EXPIRES_MIN} minutes.\n\nIf you didn't request this, ignore this email.`,
      });
    } catch (mailErr) {
      console.error("Failed sending OTP email:", mailErr);
      // note: we still created the user; respond indicating email send failure
      return res.status(500).json({ message: "Failed to send OTP email", detail: mailErr.message });
    }

    // Registration response: do NOT return token here (user must verify)
    res.status(201).json({
      message: "Registration successful. OTP sent to your email. Verify to activate your account.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
      },
    });
  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    if (!user.otpHash || !user.otpExpires) return res.status(400).json({ message: "No OTP found. Please resend OTP." });
    if (user.otpExpires < new Date()) return res.status(400).json({ message: "OTP expired. Please resend OTP." });

    const match = await bcrypt.compare(otp, user.otpHash);
    if (!match) return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Optionally return token so front-end can sign in immediately after verify
    const token = generateToken(user._id);

    res.json({
      message: "Verification successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        token,
      },
    });
  } catch (err) {
    console.error("verifyOtp error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + OTP_EXPIRES_MIN * 60 * 1000);

    user.otpHash = otpHash;
    user.otpExpires = otpExpires;
    await user.save();

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your new verification code",
        text: `Hello ${user.name},\n\nYour new verification code is: ${otp}\nIt will expire in ${OTP_EXPIRES_MIN} minutes.\n\nIf you didn't request this, ignore this email.`,
      });
    } catch (mailErr) {
      console.error("Failed sending OTP email:", mailErr);
      return res.status(500).json({ message: "Failed to send OTP email", detail: mailErr.message });
    }

    res.json({ message: "OTP resent to your email" });
  } catch (err) {
    console.error("resendOtp error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid password" });

    if (!user.isVerified) return res.status(400).json({ message: "Email not verified. Please check your email for OTP." });

    const token = generateToken(user._id);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        token,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otpHash -otpExpires");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
