const express = require("express");
const { validateToken, validateAdmin } = require("../middleware/auth.middleware");
const router = express.Router();
const {
    createVanue,
    getAllVanues,
    getVanueById,
    updateVanueById,
    deleteVanueById,
    getVanueByCity,
    getVanueByCountry,
} = require("../controllers/vanue.controller.js");

// ? Create a new vanue
router.post("/", validateToken, validateAdmin, createVanue);
// ? Get all vanues
router.get("/", getAllVanues);
// ? Get vanue by ID
router.get("/:id", getVanueById);
// ? Update vanue by ID
router.put("/:id", validateToken, validateAdmin, updateVanueById);
// ? Delete vanue by ID
router.delete("/:id", validateToken, validateAdmin, deleteVanueById);
// ? Get vanue by city
router.get("/city/:cityId", getVanueByCity);
// ? Get vanue by country
router.get("/country/:countryId", getVanueByCountry);

module.exports = router;

