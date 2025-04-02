const express = require("express");
const router = express.Router();
const { testUserAccess, testAdminAccess, testTokenValidation } = require("../controllers/test.controller");
const validateToken = require("../middleware/auth.middleware").validateToken;
const validateUser = require("../middleware/auth.middleware").validateUser;
const validateAdmin = require("../middleware/auth.middleware").validateAdmin;

router.get("/token", validateToken, testTokenValidation); // Checks if token is valid
router.get("/user", validateToken, validateUser, testUserAccess); // Checks if user role is 'user'
router.get("/admin", validateToken, validateAdmin, testAdminAccess); // Checks if user role is 'admin'

module.exports = router;
