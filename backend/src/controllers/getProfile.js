const Profile = require("../models/profile");

module.exports = getProfile = async (walletAddress) => {
  try {
    const responseProfile = await Profile.find({
      walletAddress: walletAddress,
    });
    return responseProfile;
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};
