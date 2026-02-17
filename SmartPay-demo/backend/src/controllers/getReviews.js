const Reviews = require("../models/reviews");

module.exports = getReviews = async (projectAddress) => {
  try {
    const review = await Reviews.find({ projectAddress: projectAddress });
    const data = review.map((item) => {
      return {
        userid: item.userid,
        id: item.review.id,
        image: item.review.image,
        star: item.review.star,
        description: item.review.description,
        date:
          new Date(item.review.date).toLocaleDateString("en-US", {
            timeZone: "UTC",
          }) + " via Google",
      };
    });
    return data;
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};
