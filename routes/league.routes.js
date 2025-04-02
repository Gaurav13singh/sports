const express = require("express");
const router = express.Router();
const {
    createLeague,
    getLeagues,
    getLeagueById,
    updateLeague,
    deleteLeague,
} = require("../controllers/league.controller");
const { validateToken, validateAdmin } = require("../middleware/auth.middleware");

router.post("/", validateToken, validateAdmin, createLeague); // Create league
router.get("/", getLeagues); // Get all leagues
router.get("/:id", getLeagueById); // Get league by ID
router.patch("/:id", validateToken, validateAdmin, updateLeague); // Update league
router.delete("/:id", validateToken, validateAdmin, deleteLeague); // Delete league

module.exports = router;