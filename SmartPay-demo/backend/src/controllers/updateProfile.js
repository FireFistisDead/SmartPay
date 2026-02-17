const Profile = require("../models/profile");

module.exports = updateProfile = async (data) => {
  try {
    const isUser = await Profile.findOne({
      walletAddress: data.walletAddress,
    });
    if (isUser) {
      const responseUserProfile = await Profile.findOneAndUpdate(
        { walletAddress: data.walletAddress },
        data,
        { new: true }
      );
      return responseUserProfile;
    }
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};
