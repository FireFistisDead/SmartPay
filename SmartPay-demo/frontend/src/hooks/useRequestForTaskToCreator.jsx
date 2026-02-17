"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useRequestForTaskToCreator = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleRequestForTaskToCreator = async (taskId) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.requestForTaskToCreator(taskId);
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
        "Task requested to creator successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during requesting task to creator",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleRequestForTaskToCreator };
};

export default useRequestForTaskToCreator;
