const Submission = require("../models/submission");

module.exports = insertSubmission = async (data) => {
  try {
    console.log(data);
    const isSubmission = await Submission.findOne({
      createrAddress: data.createrAddress,
      projectAddress: data.projectAddress + "",
      solverAddress: data.solverAddress,
    });
    if (isSubmission) {
      const responsejobSubmission = await Submission.updateOne(
        {
          createrAddress: data.createrAddress,
          projectAddress: data.projectAddress,
          solverAddress: data.solverAddress,
        },
        {
          subbmissionLink: data.subbmissionLink,
        }
      );
      return responsejobSubmission;
    }
    const jobSubmission = new Submission({
      createrAddress: data.createrAddress,
      projectAddress: data.projectAddress,
      solverAddress: data.solverAddress,
      subbmissionLink: data.subbmissionLink,
    });
    const responsejobSubmission = await jobSubmission.save();
    return responsejobSubmission;
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};
