"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useGetTaskCreatedAt = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleGetTaskCreatedAt = async (taskId) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.getTaskCreatedAt(taskId);
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
        "Got task created at successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during getting task created at",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleGetTaskCreatedAt };
};

export default useGetTaskCreatedAt;
