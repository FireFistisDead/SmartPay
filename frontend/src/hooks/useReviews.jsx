import { useNotification } from "./useNotification";

const useReviews = () => {
  const { NotificationHandler } = useNotification();
  const Reviews = async (data, wallet, jobId) => {
    console.log(data);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/reviews/${jobId}/${wallet}`,
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
      NotificationHandler(
        "SmartPay",
        responsedata.message,
        responsedata.type
      );
      return responsedata.type;
    } catch (err) {
      console.log(err);
      NotificationHandler("SmartPay", "Something went wrong", "Error");
      return "false";
    }
  };
  return { Reviews };
};

export default useReviews;
