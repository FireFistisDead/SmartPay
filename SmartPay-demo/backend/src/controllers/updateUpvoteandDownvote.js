const Submission = require("../models/submission");

module.exports = updateUpvoteandDownvote = async (id, type, current) => {
  current = Number(current);
  var val = 0;
  if (type == "upvote") {
    val = 1;
  } else {
    val = -1;
  }
  try {
    if (type == "upvote") {
      const responseUserSubmission = await Submission.findOneAndUpdate(
        {
          projectAddress: id,
        },
        {
          upvotes: current + 1,
        },
        { new: true }
      );
      return responseUserSubmission;
    } else {
      const responseUserSubmission = await Submission.findOneAndUpdate(
        {
          projectAddress: id,
        },
        {
          downvotes: current + 1,
        },
        { new: true }
      );
      return responseUserSubmission;
    }
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};
