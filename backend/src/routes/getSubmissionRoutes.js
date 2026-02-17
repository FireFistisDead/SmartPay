const getSubmission = require("../controllers/getSubmission");

module.exports = getSubmissionRoutes = {
  path: "/submission/:projectAddress",
  method: "get",
  handler: async (req, res) => {
    try {
      const { projectAddress } = req.params;
      const response = await getSubmission(projectAddress);
      return res.status(200).send({
        message: "Project Found!",
        response: response,
      });
    } catch (err) {
      return res.status(400).send({
        message: "Project not found!",
        response: err,
      });
    }
  },
};
