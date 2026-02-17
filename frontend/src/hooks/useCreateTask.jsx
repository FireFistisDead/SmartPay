"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useCreateTask = () => {
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();
  const { NotificationHandler } = useNotification();

  const handleCreateTask = async (task) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.createTask(task);
      if (tx == "First Connect To Wallet") {
        NotificationHandler(
          "SmartPay",
          "First Connect To Wallet",
          "Error"
        );
        setIsLoading(false);
        return false;
      } else {
        NotificationHandler(
          "SmartPay",
          "You have successfully created a new task",
          "Success"
        );
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during task creating",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleCreateTask };
};

export default useCreateTask;
