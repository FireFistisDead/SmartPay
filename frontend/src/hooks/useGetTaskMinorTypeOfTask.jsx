"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useGetTaskMinorTypeOfTask = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleGetTaskMinorTypeOfTask = async (taskId) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.getTaskMinorTypeOfTask(taskId);
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
        "Got task minor type of task successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during getting task minor type of task",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleGetTaskMinorTypeOfTask };
};

export default useGetTaskMinorTypeOfTask;
