const mongoose = require("mongoose");

const CountrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    flag: {
      type: String, // URL for flag image
      default: "",
    },
  },
  { timestamps: true }
);

const Country = mongoose.model("Country", CountrySchema);
module.exports = Country;
