const Country = require("../models/country.model");
const cloudinary = require("../config/cloudinaryConfig");
const errorHandler = require("../utils/error");
const responseHandler = require("../utils/response");

// ✅ Create a new country with flag image upload
const createCountry = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !req.file) {
      return errorHandler(res, 400, "Name and flag image are required.");
    }

    // Check if country already exists
    const existingCountry = await Country.findOne({ name });
    if (existingCountry) {
      return errorHandler(res, 400, "Country already exists.");
    }

    // Upload flag image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "country_flags", // Cloudinary folder
    });

    // Create new country with Cloudinary flag URL
    const country = new Country({
      name,
      flag: result.secure_url, // Store Cloudinary link
    });

    await country.save();
    return responseHandler(res, 201, "Country created successfully.", country);
  } catch (error) {
    return errorHandler(res, 500, "Internal Server Error.", error);
  }
};

// ✅ Get all countries
const getAllCountries = async (req, res) => {
  try {
    const countries = await Country.find().sort({ name: 1 });
    return responseHandler(res, 200, "Countries fetched successfully.", countries);
  } catch (error) {
    return errorHandler(res, 500, "Internal Server Error.");
  }
};

// ✅ Get country by ID
const getCountryById = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await Country.findById(id);

    if (!country) {
      return errorHandler(res, 404, "Country not found.");
    }

    return responseHandler(res, 200, "Country fetched successfully.", country);
  } catch (error) {
    return errorHandler(res, 500, "Internal Server Error.");
  }
};

// ✅ Update country (with optional flag image update)
const updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    let updateData = { name };

    // If a new flag image is uploaded, update it in Cloudinary
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "country_flags",
      });
      updateData.flag = result.secure_url; // Update Cloudinary link in database
    }

    const updatedCountry = await Country.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCountry) {
      return errorHandler(res, 404, "Country not found.");
    }

    return responseHandler(res, 200, "Country updated successfully.", updatedCountry);
  } catch (error) {
    return errorHandler(res, 500, "Internal Server Error.");
  }
};

// ✅ Delete country by ID
const deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCountry = await Country.findByIdAndDelete(id);

    if (!deletedCountry) {
      return errorHandler(res, 404, "Country not found.");
    }

    return responseHandler(res, 200, "Country deleted successfully.", {
      deletedCountry
    });
  } catch (error) {
    return errorHandler(res, 500, "Internal Server Error.");
  }
};

module.exports = {
  createCountry,
  getAllCountries,
  getCountryById,
  updateCountry,
  deleteCountry,
};
