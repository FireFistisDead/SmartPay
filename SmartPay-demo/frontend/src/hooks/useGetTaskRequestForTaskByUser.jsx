"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useGetTaskRequestForTaskByUser = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleGetTaskRequestForTaskByUser = async (taskId) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.getTaskRequestForTaskByUser(taskId);
      if (tx == "First Connect To Wallet") {
        NotificationHandler(
          "SmartPay",
          "First Connect To Wallet",
          "Error"
        );
        setIsLoading(false);
        return false;
      }
      NotificationHandler(
        "SmartPay",
        "Got task request for task by user successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during getting task request for task by user",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleGetTaskRequestForTaskByUser };
};

export default useGetTaskRequestForTaskByUser;
