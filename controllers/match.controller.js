const mongoose = require("mongoose");
const Match = require("../models/match.model");
const User = require("../models/user.model");
const UserPreferences = require("../models/userPreferences.model");
const responseHandler = require("../utils/response");
const errorHandler = require("../utils/error");

const createMatch = async (req, res) => {
    try {
        const { title, league, firstTeam, secondTeam, matchDateTime, venue, ottPlatform, location } = req.body;

        // Validate required fields
        if (!title || !league || !firstTeam || !secondTeam || !matchDateTime || !venue || !location?.latitude || !location?.longitude) {
            return errorHandler(res, 400, "All required fields must be provided.");
        }

        // Validate League ObjectId
        if (!mongoose.Types.ObjectId.isValid(league)) {
            return errorHandler(res, 400, "Invalid League ID.");
        }

        // Check if League exists
        const leagueData = await League.findById(league)
            .select("name country startDate endDate")
            .populate("country", "name code flag");

        if (!leagueData) {
            return errorHandler(res, 404, "League not found.");
        }

        // Check if Match title already exists (to avoid duplicate titles)
        const existingMatch = await Match.findOne({ title });
        if (existingMatch) {
            return errorHandler(res, 400, "Match title must be unique. This title is already taken.");
        }

        // Create new match
        const match = new Match({
            title,
            league,
            firstTeam,
            secondTeam,
            matchDateTime,
            venue,
            ottPlatform,
            location,
        });

        // Save to DB
        await match.save();

        // Return match data along with league details
        return responseHandler(res, 201, "Match created successfully.", {
            _id: match._id,
            title: match.title,
            firstTeam: match.firstTeam,
            secondTeam: match.secondTeam,
            matchDateTime: match.matchDateTime,
            venue: match.venue,
            ottPlatform: match.ottPlatform,
            location: match.location,
            league: {
                _id: leagueData._id,
                name: leagueData.name,
                startDate: leagueData.startDate,
                endDate: leagueData.endDate,
                country: leagueData.country
                    ? {
                        name: leagueData.country.name,
                        code: leagueData.country.code,
                        flag: leagueData.country.flag,
                    }
                    : null,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return errorHandler(res, 400, "Match title must be unique. Duplicate entry detected.");
        }
        return errorHandler(res, 500, error.message || "Something went wrong while creating the match.");
    }
};

const updateMatch = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { title, league, firstTeam, secondTeam, matchDateTime, venue, ottPlatform, location } = req.body;

        // Validate matchId
        if (!mongoose.Types.ObjectId.isValid(matchId)) {
            return errorHandler(res, 400, "Invalid Match ID.");
        }

        // Find existing match
        let match = await Match.findById(matchId);
        if (!match) {
            return errorHandler(res, 404, "Match not found.");
        }

        // Check for unique title (only if title is being updated)
        if (title && title !== match.title) {
            const existingMatch = await Match.findOne({ title });
            if (existingMatch) {
                return errorHandler(res, 400, "Match title must be unique. This title is already taken.");
            }
        }

        // Validate league if updated
        let leagueData = null;
        if (league && league !== match.league.toString()) {
            if (!mongoose.Types.ObjectId.isValid(league)) {
                return errorHandler(res, 400, "Invalid League ID.");
            }

            leagueData = await League.findById(league).select("name country startDate endDate").populate("country", "name code flag");
            if (!leagueData) {
                return errorHandler(res, 404, "League not found.");
            }
        }

        // Update match details
        match.title = title || match.title;
        match.league = league || match.league;
        match.firstTeam = firstTeam || match.firstTeam;
        match.secondTeam = secondTeam || match.secondTeam;
        match.matchDateTime = matchDateTime || match.matchDateTime;
        match.venue = venue || match.venue;
        match.ottPlatform = ottPlatform || match.ottPlatform;
        match.location = location || match.location;

        await match.save();

        // Populate league data if updated
        if (leagueData) {
            match = match.toObject();
            match.league = {
                _id: leagueData._id,
                name: leagueData.name,
                startDate: leagueData.startDate,
                endDate: leagueData.endDate,
                country: leagueData.country
                    ? {
                        name: leagueData.country.name,
                        code: leagueData.country.code,
                        flag: leagueData.country.flag,
                    }
                    : null,
            };
        }

        return responseHandler(res, 200, "Match updated successfully.", match);
    } catch (error) {
        return errorHandler(res, 500, error.message || "Something went wrong while updating the match.");
    }
};

const deleteMatch = async (req, res) => {
    try {
        const { matchId } = req.params;

        // Validate matchId
        if (!mongoose.Types.ObjectId.isValid(matchId)) {
            return errorHandler(res, 400, "Invalid Match ID.");
        }

        // Find match with league details
        const match = await Match.findById(matchId).populate({
            path: "league",
            select: "name country startDate endDate",
            populate: {
                path: "country",
                select: "name code flag",
            },
        });

        if (!match) {
            return errorHandler(res, 404, "Match not found.");
        }

        // Delete match from database
        await Match.findByIdAndDelete(matchId);

        return responseHandler(res, 200, "Match deleted successfully.", {
            _id: match._id,
            title: match.title,
            firstTeam: match.firstTeam,
            secondTeam: match.secondTeam,
            matchDateTime: match.matchDateTime,
            venue: match.venue,
            ottPlatform: match.ottPlatform,
            location: match.location,
            league: {
                _id: match.league._id,
                name: match.league.name,
                startDate: match.league.startDate,
                endDate: match.league.endDate,
                country: match.league.country
                    ? {
                        name: match.league.country.name,
                        code: match.league.country.code,
                        flag: match.league.country.flag,
                    }
                    : null,
            },
        });
    } catch (error) {
        return errorHandler(res, 500, error.message || "Something went wrong while deleting the match.");
    }
};

const getUserMatches = async (req, res) => {
    try {
        // Ensure user is authenticated
        if (!req.user || !req.user._id) {
            return errorHandler(res, 400, "User authentication failed.");
        }

        const userId = req.user._id;

        // Fetch user preferences (only favorite leagues)
        const userPreferences = await UserPreferences.findOne({ userId }).select("favoriteLeagues").lean();

        if (!userPreferences || userPreferences.favoriteLeagues.length === 0) {
            return responseHandler(res, 200, "No favorite leagues found. No matches to display.", { matches: [] });
        }

        // Extract league IDs
        const favoriteLeagueIds = userPreferences.favoriteLeagues.map((leagueId) => leagueId.toString());

        // Fetch matches for the user's favorite leagues
        const matches = await Match.find({ league: { $in: favoriteLeagueIds } })
            .populate({
                path: "league",
                select: "name startDate endDate country",
                populate: { path: "country", select: "name code flag" }, // Populate country details
            })
            .lean();

        // Format response data
        const formattedMatches = matches.map((match) => ({
            _id: match._id,
            title: match.title,
            firstTeam: match.firstTeam,
            secondTeam: match.secondTeam,
            matchDateTime: match.matchDateTime,
            venue: match.venue,
            ottPlatform: match.ottPlatform,
            location: match.location,
            league: match.league
                ? {
                    _id: match.league._id,
                    name: match.league.name,
                    startDate: match.league.startDate,
                    endDate: match.league.endDate,
                    country: match.league.country
                        ? {
                            name: match.league.country.name,
                            code: match.league.country.code,
                            flag: match.league.country.flag,
                        }
                        : null,
                }
                : null,
        }));

        return responseHandler(res, 200, "User matches retrieved successfully.", { matches: formattedMatches });
    } catch (error) {
        return errorHandler(res, 500, error.message || "Something went wrong while fetching matches.");
    }
};

const getAllMatches = async (req, res) => {
    try {
        const matches = await Match.find()
            .populate({
                path: "league",
                select: "name startDate endDate country",
                populate: { path: "country", select: "name code flag" }, // Populate country details
            })
            .lean();

        return responseHandler(res, 200, "All matches retrieved successfully.", { matches });
    } catch (error) {
        return errorHandler(res, 500, error.message || "Something went wrong while fetching matches.");
    }
};

// Fetch match by ID
const getMatchById = async (req, res) => {
    try {
        const { matchId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(matchId)) {
            return errorHandler(res, 400, "Invalid match ID.");
        }

        const match = await Match.findById(matchId)
            .populate({
                path: "league",
                select: "name startDate endDate country",
                populate: { path: "country", select: "name code flag" }, // Populate country details
            })
            .lean();

        if (!match) {
            return errorHandler(res, 404, "Match not found.");
        }

        return responseHandler(res, 200, "Match retrieved successfully.", { match });
    } catch (error) {
        return errorHandler(res, 500, error.message || "Something went wrong while fetching the match.");
    }
};
module.exports = { createMatch, updateMatch, deleteMatch, getUserMatches, getAllMatches, getMatchById };