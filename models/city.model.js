const mongoose = require("mongoose");

const CitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    geolocation: {
      type: String,//Url of City location,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const City = mongoose.model("City", CitySchema);
module.exports = City;
