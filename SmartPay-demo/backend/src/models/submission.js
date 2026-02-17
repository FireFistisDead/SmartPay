const mongoose = require("mongoose");
const { v4 } = require("uuid");

const submissionSchema = new mongoose.Schema({
  id: {
    type: String,
    default: v4,
  },
  createrAddress: {
    type: String,
    required: true,
  },
  projectAddress: {
    type: String,
    required: true,
  },
  solverAddress: {
    type: String,
    required: true,
  },
  subbmissionLink: {
    type: String,
    required: true,
  },
  submissionDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  upvotes: {
    type: Number,
    required: true,
    default: 0,
  },
  downvotes: {
    type: Number,
    required: true,
    default: 0,
  },
});

module.exports = mongoose.model("submission", submissionSchema);
