const City = require("../models/city.model");
const cloudinary = require("../config/cloudinaryConfig");
const errorHandler = require("../utils/error");
const responseHandler = require("../utils/response");

// ✅ Create a new city with geolocation image upload
const createCity = async (req, res) => {
    try {
        const { name, country, geolocation, description } = req.body;
    
        if (!name || !country || !geolocation) {
        return errorHandler(res, 400, "Name, country, and geolocation are required.");
        }
    
        // Check if city already exists
        const existingCity = await City.findOne({ name });
        if (existingCity) {
        return errorHandler(res, 400, "City already exists.");
        }
    
        // Upload geolocation image to Cloudinary
        const result = await cloudinary.uploader.upload(geolocation, {
        folder: "city_geolocations", // Cloudinary folder
        });
    
        // Create new city with Cloudinary geolocation URL
        const city = new City({
        name,
        country,
        geolocation: result.secure_url, // Store Cloudinary link
        description,
        });
    
        await city.save();
        return responseHandler(res, 201, "City created successfully.", city);
    } catch (error) {
        return errorHandler(res, 500, "Internal Server Error.", error);
    }
    }


// ✅ Get all cities
const getAllCities = async (req, res) => {
    try {
        const cities = await City.find().populate("country").sort({ name: 1 });
        return responseHandler(res, 200, "Cities fetched successfully.", cities);
    } catch (error) {
        return errorHandler(res, 500, "Internal Server Error.");
    }
}
// ✅ Get city by ID
const getCityById = async (req, res) => {
    try {
        const { id } = req.params;
        const city = await City.findById(id).populate("country");
    
        if (!city) {
        return errorHandler(res, 404, "City not found.");
        }
    
        return responseHandler(res, 200, "City fetched successfully.", city);
    } catch (error) {
        return errorHandler(res, 500, "Internal Server Error.");
    }
}


// ✅ Update city details
const updateCity = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, country, geolocation, description } = req.body;
    
        // Check if city exists
        const existingCity = await City.findById(id);
        if (!existingCity) {
        return errorHandler(res, 404, "City not found.");
        }
    
        // Update city details
        existingCity.name = name || existingCity.name;
        existingCity.country = country || existingCity.country;
        existingCity.geolocation = geolocation || existingCity.geolocation;
        existingCity.description = description || existingCity.description;
    
        await existingCity.save();
        return responseHandler(res, 200, "City updated successfully.", existingCity);
    } catch (error) {
        return errorHandler(res, 500, "Internal Server Error.");
    }
}


// ✅ Delete city
const deleteCity = async (req, res) => {
    try {
        const { id } = req.params;
        const city = await City.findByIdAndDelete(id);
    
        if (!city) {
        return errorHandler(res, 404, "City not found.");
        }
    
        return responseHandler(res, 200, "City deleted successfully.", city);
    } catch (error) {
        return errorHandler(res, 500, "Internal Server Error.");
    }
}

module.exports = {
    createCity,
    getAllCities,
    getCityById,
    updateCity,
    deleteCity
}