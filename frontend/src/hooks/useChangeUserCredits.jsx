import { useNotification } from "./useNotification";

const useChangeUserCredits = () => {
  const { NotificationHandler } = useNotification();
  const changeUserCredits = async (data) => {
    console.log(data);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/updatecredits`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
      const responsedata = await response.json();
      NotificationHandler("SmartPay", responsedata.message, "Success");
      return responsedata.response;
    } catch (err) {
      console.log(err);
      NotificationHandler("SmartPay", "Something went wrong", "Error");
      return "false";
    }
  };
  return { changeUserCredits };
};

export default useChangeUserCredits;
