const express = require("express");
const { googleLogin, facebookLogin, manualSignup, verifyEmail, manualLogin ,forgotPassword, resetPassword} = require("../controllers/auth.controller");
const upload = require("../middleware/upload");
const router = express.Router();

// Google Login Route
router.post("/google-login", googleLogin);

// Facebook Login Route
router.post("/facebook-login", facebookLogin);

// manual signup and login
router.post("/signup", upload.single("profilePic"), manualSignup);
router.get("/verify-email/:token", verifyEmail);
router.post("/login", manualLogin);

router.post("/forgot-password", forgotPassword);

// Reset Password - Update New Password
router.post("/reset-password/:token", resetPassword);

module.exports = router;