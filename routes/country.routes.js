const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  createCountry,
  getAllCountries,
  getCountryById,
  updateCountry,
  deleteCountry,
} = require("../controllers/country.controller");
const {validateToken,validateAdmin} = require("../middleware/auth.middleware");

// Routes
router.post("/", validateToken,validateAdmin,upload.single("flag"), createCountry); // Upload flag image
router.get("/", getAllCountries);
router.get("/:id", getCountryById);
router.patch("/:id", validateToken,validateAdmin,upload.single("flag"), updateCountry); // Allow flag image update
router.delete("/:id", validateToken,validateAdmin,deleteCountry);

module.exports = router;