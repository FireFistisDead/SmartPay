import { useNotification } from "./useNotification";

const useSubmissionLink = () => {
  const { NotificationHandler } = useNotification();
  const submissionLink = async (data) => {
    console.log(data);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/insertSubmission`,
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
  return { submissionLink };
};

export default useSubmissionLink;
