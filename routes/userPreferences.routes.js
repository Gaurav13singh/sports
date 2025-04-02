const express = require("express");
const router = express.Router();
const { createUserPreferences,getUserPreferences,getAllUserPreferences,getUserPreferencesByPreferenceId,updateUserPreferences,deleteUserPreference } = require("../controllers/userPreferences.controller");
const {validateToken,validateAdmin} = require("../middleware/auth.middleware");

// Route to create/update user preferences
router.post("/", validateToken,createUserPreferences);
router.get("/",validateToken,getUserPreferences)
router.get("/all", validateToken,validateAdmin ,getAllUserPreferences);
router.get("/:id", validateToken,validateAdmin,getUserPreferencesByPreferenceId);
router.patch("/", validateToken, updateUserPreferences);
router.delete("/:id", validateToken, validateAdmin,deleteUserPreference);

module.exports = router;