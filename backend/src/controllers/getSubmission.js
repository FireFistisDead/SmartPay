const Submission = require("../models/submission");

module.exports = getSubmission = async (projectAddress) => {
  try {
    if (projectAddress !== undefined) {
      const stringProjectAddress = projectAddress.toString();
      const responseSubmission = await Submission.findOne({
        projectAddress: stringProjectAddress,
      });
      return responseSubmission;
    }
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};
