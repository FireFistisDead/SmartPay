const updateProfile = require("../controllers/updateProfile");

module.exports = updateProfileRoutes = {
  path: "/user/update",
  method: "post",
  handler: async (req, res) => {
    try {
      const data = req.body;
      const response = await updateProfile(data);
      return res.status(200).send({
        message: "User Updated Sucessfully!",
        response: response,
      });
    } catch (err) {
      return res.status(400).send({
        message: "User not found!",
        response: err,
      });
    }
  },
};
