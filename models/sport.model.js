const mongoose = require("mongoose");

const SportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true, // Ensures sport names are unique
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      required: true,
    },
    countries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Country", // Reference to the Country model
        required: true,
      },
    ],
  },
  { timestamps: true }
);

const Sport = mongoose.model("Sport", SportSchema);
module.exports = Sport;