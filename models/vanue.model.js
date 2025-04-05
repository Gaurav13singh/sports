const mongoose = require("mongoose");

const VenueSchema = new mongoose.Schema(
  {
    venueId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    geolocation: {
      type: String,//Url of Venue location,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    city:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
        required: true,
    },
    country:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Country",
        required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Venue = mongoose.model("Venue", VenueSchema);
module.exports = Venue;
