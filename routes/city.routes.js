const express = require("express");
const { validateToken, validateAdmin } = require("../middleware/auth.middleware");
const { createCity, getAllCities, getCityById, updateCity, deleteCity } = require("../controllers/city.controller");
const router = express.Router();



router.post("/", validateToken,validateAdmin, createCity); //City creation route
router.get("/", getAllCities);
router.get("/:id", getCityById);
router.patch("/:id", validateToken,validateAdmin, updateCity); // City update route
router.delete("/:id", validateToken,validateAdmin,deleteCity); // City deletion route

module.exports = router;