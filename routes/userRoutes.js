
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const userController = require("../controllers/userController");

const {
  getProfile,
  register,
  login,
  uploadImage,
  resetPassword
} = require("../controllers/userController");

const { authMiddleware } = require("../middleware/authMiddleware");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/profileImages';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + ext);
  }
});

const upload = multer({ storage });

router.post("/register", register);

router.post("/login", login);

router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

router.get("/profile", authMiddleware, getProfile);
router.post("/reset-password", authMiddleware, resetPassword);
router.post("/upload-image", authMiddleware, upload.single("profileImage"), uploadImage);

module.exports = router;







