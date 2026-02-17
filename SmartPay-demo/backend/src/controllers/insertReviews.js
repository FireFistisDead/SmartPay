const Reviews = require("../models/reviews");

module.exports = insertReviewsRoutes = async (userid, projectAddress, data) => {
  try {
    const review = new Reviews({
      userid: userid,
      projectAddress: projectAddress,
      review: data,
    });
    const responseReview = await review.save();
    return responseReview;
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};
