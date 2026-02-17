const getReviews = require("../controllers/getReviews");

module.exports = getReviewsRoutes = {
  path: "/reviews/:projectAddress",
  method: "get",
  handler: async (req, res) => {
    try {
      const { projectAddress } = req.params;
      const response = await getReviews(projectAddress);
      return res.status(200).send({
        message: "Reviews Found!",
        response: response,
      });
    } catch (err) {
      return res.status(400).send({
        message: "Reviews Not Found!",
        response: err.message,
      });
    }
  },
};
