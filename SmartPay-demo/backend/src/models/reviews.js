const mongoose = require("mongoose");
const { v4 } = require("uuid");

const { Schema } = mongoose;

const reviewsSchema = new Schema({
  userid: {
    type: String,
  },
  projectAddress: {
    type: String,
  },
  review: {
    image: {
      type: String,
      trim: true,
    },
    star: {
      type: String,
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    id: {
      type: String,
      default: v4,
    },
  },
});

module.exports = mongoose.model("review", reviewsSchema);
