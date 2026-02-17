const updateUpvoteandDownvote = require("../controllers/updateUpvoteandDownvote");

module.exports = updateUpvoteandDownvoteRoutes = {
  path: "/submission/:id/:type/:current",
  method: "put",
  handler: async (req, res) => {
    try {
      const { id, type, current } = req.params;
      const response = await updateUpvoteandDownvote(id, type, current);
      return res.status(200).send({
        message: "Upvote and Downvote updated successfully!",
        response: response,
      });
    } catch (err) {
      return res.status(400).send({
        message: "Upvote and Downvote update failed!",
        response: err,
      });
    }
  },
};
