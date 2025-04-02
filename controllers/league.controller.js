const mongoose = require("mongoose");
const League = require("../models/league.model");
const Sport = require("../models/sport.model");
const Country = require("../models/country.model");
const errorHandler = require("../utils/error");
const responseHandler = require("../utils/response");


const createLeague = async (req, res) => {
    try {
        const { name, sport, country, category, startDate, endDate } = req.body;

        // Validate required fields
        if (!name || !sport || !country || !category || !startDate || !endDate) {
            return errorHandler(res, 400, "All fields are required.");
        }

        // Check if league with the same name already exists
        const existingLeague = await League.findOne({ name });
        if (existingLeague) {
            return errorHandler(res, 400, "League name already exists.");
        }

        // Validate if the sport and country IDs are valid ObjectIds
        if (!mongoose.Types.ObjectId.isValid(sport) || !mongoose.Types.ObjectId.isValid(country)) {
            return errorHandler(res, 400, "Invalid sport or country ID.");
        }

        // Check if Sport and Country exist in the database
        const sportData = await Sport.findById(sport);
        if (!sportData) {
            return errorHandler(res, 400, "Sport not found.");
        }

        const countryData = await Country.findById(country);
        if (!countryData) {
            return errorHandler(res, 400, "Country not found.");
        }

        // Check if the sport is available in the given country
        if (!sportData.countries.includes(country)) {
            return errorHandler(res, 400, `The sport '${sportData.name}' is not available in '${countryData.name}'.`);
        }

        // Create a new league with ObjectId references
        const newLeague = new League({
            name,
            sport,
            country,
            category,
            startDate,
            endDate,
        });

        await newLeague.save();

        // Populate the response to return full details instead of only ObjectIds
        const populatedLeague = await League.findById(newLeague._id)
            .populate("sport", "name") // Fetch only 'name' from Sport
            .populate("country", "name"); // Fetch 'name' and 'code' from Country

        return responseHandler(res, 201, "League created successfully.", populatedLeague);
    } catch (error) {
        return errorHandler(res, 500, "Internal Server Error", error.message);
    }
};

// Get all leagues with sport and country details
const getLeagues = async (req, res) => {
    try {
        const leagues = await League.find()
            .populate("sport", "name logo")
            .populate("country", "name flag");

        if (!leagues.length) {
            return errorHandler(res, 404, "No leagues found.");
        }

        return responseHandler(res, 200, "Leagues retrieved successfully.", leagues);
    } catch (error) {
        return errorHandler(res, 500, "Something went wrong while fetching leagues.", error);
    }
};

// Get league by ID with sport and country details
const getLeagueById = async (req, res) => {
    try {
        const { id } = req.params;
        const league = await League.findById(id)
            .populate("sport", "name logo")
            .populate("country", "name flag");

        if (!league) {
            return errorHandler(res, 404, "League not found.");
        }

        return responseHandler(res, 200, "League retrieved successfully.", league);
    } catch (error) {
        return errorHandler(res, 500, "Something went wrong while fetching the league.", error);
    }
};

// Update league
const updateLeague = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, sport, country, category, startDate, endDate } = req.body;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorHandler(res, 400, "Invalid League ID.");
        }

        // Check if league exists
        const existingLeague = await League.findById(id);
        if (!existingLeague) {
            return errorHandler(res, 404, "League not found.");
        }

        let sportId = existingLeague.sport;
        let countryId = existingLeague.country;

        // Validate sport if provided
        if (sport) {
            if (!mongoose.Types.ObjectId.isValid(sport)) {
                return errorHandler(res, 400, "Invalid sport ID.");
            }
            const foundSport = await Sport.findById(sport);
            if (!foundSport) {
                return errorHandler(res, 404, "Sport not found.");
            }
            sportId = foundSport._id;
        }

        // Validate country if provided
        if (country) {
            if (!mongoose.Types.ObjectId.isValid(country)) {
                return errorHandler(res, 400, "Invalid country ID.");
            }
            const foundCountry = await Country.findById(country);
            if (!foundCountry) {
                return errorHandler(res, 404, "Country not found.");
            }

            // Ensure sport is available in the selected country
            const foundSport = await Sport.findById(sportId);
            const countryExistsInSport = foundSport.countries.some(
                (c) => c.toString() === country
            );

            if (!countryExistsInSport) {
                return errorHandler(res, 400, `The sport '${foundSport.name}' is not available in the selected country.`);
            }

            countryId = foundCountry._id;
        }

        // Update League Details
        existingLeague.name = name || existingLeague.name;
        existingLeague.sport = sportId;
        existingLeague.country = countryId;
        existingLeague.category = category || existingLeague.category;
        existingLeague.startDate = startDate || existingLeague.startDate;
        existingLeague.endDate = endDate || existingLeague.endDate;

        // Save Updated League
        await existingLeague.save();

        // Populate the response to return full details
        const populatedLeague = await League.findById(existingLeague._id)
            .populate("sport", "name") // Fetch only 'name' from Sport
            .populate("country", "name"); // Fetch 'name' and 'code' from Country

        return responseHandler(res, 200, "League updated successfully.", populatedLeague);
    } catch (error) {
        return errorHandler(res, 500, "Something went wrong.", error.message);
    }
};

// Delete league
const deleteLeague = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorHandler(res, 400, "Invalid League ID.");
        }

        // Check if the league exists
        const league = await League.findById(id)
            .populate("sport", "name") // Fetch only 'name' from Sport
            .populate("country", "name"); // Fetch 'name' and 'code' from Country

        if (!league) {
            return errorHandler(res, 404, "League not found.");
        }

        // Delete the league
        await League.deleteOne({ _id: id });

        return responseHandler(res, 200, "League deleted successfully.", league);
    } catch (error) {
        return errorHandler(res, 500, "Something went wrong while deleting the league.", error.message);
    }
};

module.exports = {
    createLeague,
    getLeagues,
    getLeagueById,
    updateLeague,
    deleteLeague,
};
