import { useNotification } from "./useNotification";

const useGetUserProfile = () => {
  const { NotificationHandler } = useNotification();
  const getUserProfile = async (new_wallet) => {
    try {
      const headers = new Headers({
        "Content-Type": "application/json",
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${new_wallet}`,
        {
          method: "get",
          headers: headers,
        }
      );
      const resData = await response.json();
      console.log(resData);
      const profile = resData?.response?.[0];
      NotificationHandler("SmartPay", resData.message, "Success");
      if (!profile) {
        throw new Error("Profile not found");
      }
      return {
        firstName: profile.firstName,
        lastName: profile.lastName,
        description: profile.description,
        credits: profile.credits,
        walletAddress: profile.walletAddress,
      };
    } catch (err) {
      console.log(err);
      NotificationHandler("SmartPay", "Something went wrong", "Error");
      return {
        firstName: "Unknown",
        lastName: "Unknown",
        description: "Unknown",
        credits: 0,
        walletAddress: new_wallet,
      };
    }
  };
  return { getUserProfile };
};

export default useGetUserProfile;
