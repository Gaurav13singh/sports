const express = require("express");
const router = express.Router();
const { createMatch, updateMatch,deleteMatch ,getUserMatches,getAllMatches,getMatchById} = require("../controllers/match.controller");
const { validateToken, validateAdmin } = require("../middleware/auth.middleware");

// Match Routes
router.post("/", validateToken, validateAdmin, createMatch);
router.patch("/:matchId", validateToken, validateAdmin, updateMatch);
router.delete("/:matchId", validateToken, validateAdmin, deleteMatch);
router.get("/user-matches", validateToken, getUserMatches);
router.get("/", validateToken,validateAdmin,getAllMatches);
router.get("/:matchId", validateToken,validateAdmin,getMatchById);

module.exports = router;