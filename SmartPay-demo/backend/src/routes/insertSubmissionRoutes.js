const insertSubmission = require("../controllers/insertSubmission");

module.exports = insertSubmissionRoutes = {
  path: "/user/insertSubmission",
  method: "post",
  handler: async (req, res) => {
    try {
      const data = req.body;
      const response = await insertSubmission(data);
      return res.status(200).send({
        message: "Work saved successfully!",
        response: response,
        type: "Success",
      });
    } catch (err) {
      return res.status(400).send({
        message: "Work could not be saved!",
        response: err,
        type: "Error",
      });
    }
  },
};
