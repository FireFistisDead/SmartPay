"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useGetTaskTeckStack = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleGetTaskTeckStack = async (taskId) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.getTaskTeckStack(taskId);
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
        "Got task teck stack successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during getting task teck stack",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleGetTaskTeckStack };
};

export default useGetTaskTeckStack;
