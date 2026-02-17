const insertProfile = require("../controllers/insertProfile");

module.exports = insertProfileRoutes = {
  path: "/user/insertProfile",
  method: "post",
  handler: async (req, res) => {
    try {
      const data = req.body;
      const response = await insertProfile(data);
      return res.status(200).send({
        message: "Profile saved successfully!",
        response: response,
        type: "Success",
      });
    } catch (err) {
      return res.status(400).send({
        message: "Profile could not be saved!",
        response: err,
        type: "Error",
      });
    }
  },
};
