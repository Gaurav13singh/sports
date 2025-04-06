const Vanue = require('../models/vanue.model.js');
const cloudanary = require('../utils/cloudinary.js');
const errorHandler = require('../utils/error.js');
const responseHandler = require('../utils/response.js');

const createVanue = async (req, res) => {
    try {
        const { name, city, geolocation, description } = req.body;

        if (!name || !city || !geolocation) {
            return errorHandler(res, 400, 'Name, city, and geolocation are required.');
        }

        // Check if vanue already exists
        const existingVanue = await Vanue.findOne({ name });
        if (existingVanue) {
            return errorHandler(res, 400, 'Vanue already exists.');
        }

        // Create new vanue with Cloudinary geolocation URL
        const vanue = new Vanue({
            name,
            city,
            geolocation,
            description,
        });

        await vanue.save();
        return responseHandler(res, 201, 'Vanue created successfully.', vanue);
    } catch (error) {
        return errorHandler(res, 500, 'Internal Server Error.', error);
    }
}

// ? Get all vanues
const getAllVanues = async (req, res) => {
    try {
        const vanues = await Vanue.find().populate('city').sort({ name: 1 });
        return responseHandler(res, 200, 'Vanues fetched successfully.', vanues);
    } catch (error) {
        return errorHandler(res, 500, 'Internal Server Error.');
    }
}

// ? Get vanue by ID
const getVanueById = async (req, res) => {
    try {
        const { id } = req.params;
        const vanue = await Vanue.findById(id).populate('city');
        if (!vanue) {
            return errorHandler(res, 404, 'Vanue not found.');
        }
        return responseHandler(res, 200, 'Vanue fetched successfully.', vanue);
    } catch (error) {
        return errorHandler(res, 500, 'Internal Server Error.');
    }
}

// ? Update vanue by ID

const updateVanueById = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, city, geolocation, description } = req.body;
        const vanue = await Vanue.findById(id);
        if (!vanue) {
            return errorHandler(res, 404, 'Vanue not found.');
        }
        if (name) vanue.name = name;
        if (city) vanue.city = city;
        if (geolocation) vanue.geolocation = geolocation;
        if (description) vanue.description = description;
        await vanue.save();
        return responseHandler(res, 200, 'Vanue updated successfully.', vanue);
    } catch (error) {
        return errorHandler(res, 500, 'Internal Server Error.');
    }
}

// ? Delete vanue by ID
const deleteVanueById = async (req, res) => {
    try {
        const { id } = req.params;
        const vanue = await Vanue.findByIdAndDelete(id);
        if (!vanue) {
            return errorHandler(res, 404, 'Vanue not found.');
        }
        return responseHandler(res, 200, 'Vanue deleted successfully.', vanue);
    } catch (error) {
        return errorHandler(res, 500, 'Internal Server Error.');
    }
}

// ? Get all vanues by city
const getVanuesByCity = async (req, res) => {
    try {
        const { cityId } = req.params;
        const vanues = await Vanue.find({ city: cityId }).populate('city');
        if (!vanues || vanues.length === 0) {
            return errorHandler(res, 404, 'No vanues found for this city.');
        }
        return responseHandler(res, 200, 'Vanues fetched successfully.', vanues);
    } catch (error) {
        return errorHandler(res, 500, 'Internal Server Error.');
    }
}

// ? Get all vanues by country
const getVanuesByCountry = async (req, res) => {
    try {
        const { countryId } = req.params;
        const vanues = await Vanue.find({ country: countryId }).populate('country');
        if (!vanues || vanues.length === 0) {
            return errorHandler(res, 404, 'No vanues found for this country.');
        }
        return responseHandler(res, 200, 'Vanues fetched successfully.', vanues);
    } catch (error) {
        return errorHandler(res, 500, 'Internal Server Error.');
    }

}

module.exports = {
    createVanue,
    getAllVanues,
    getVanueById,
    updateVanueById,
    deleteVanueById,
    getVanuesByCity,
    getVanuesByCountry
};