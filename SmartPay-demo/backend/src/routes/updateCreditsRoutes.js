const updateCredits = require("../controllers/updateCredits");

module.exports = updateCreditsRoutes = {
  path: "/user/updatecredits",
  method: "post",
  handler: async (req, res) => {
    try {
      const data = req.body;
      const response = await updateCredits(data);
      return res.status(200).send({
        message: "Credits updated successfully! ",
        response: response,
      });
    } catch (err) {
      return res.status(400).send({
        message: "Error updating credits! ",
        response: err,
      });
    }
  },
};
