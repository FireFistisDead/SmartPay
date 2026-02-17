const getProfileRoutes = require("./getProfileRoutes");
const getReviewsRoutes = require("./getReviewsRoutes");
const getSubmissionRoutes = require("./getSubmissionRoutes");
const insertSubmissionRoutes = require("./insertSubmissionRoutes");
const insertReviewRoutes = require("./insertReviewsRoutes");
const insertProfileRoutes = require("./insertProfileRoutes");
const updateProfileRoutes = require("./updateProfileRoutes");
const updateUpvoteandDownvoteRoutes = require("./updateUpvoteandDownvoteRoutes");
const updateCreditsRoutes = require("./updateCreditsRoutes");

module.exports = routes = [
  getProfileRoutes,
  getReviewsRoutes,
  getSubmissionRoutes,
  insertSubmissionRoutes,
  insertReviewRoutes,
  insertProfileRoutes,
  updateProfileRoutes,
  updateUpvoteandDownvoteRoutes,
  updateCreditsRoutes,
];
