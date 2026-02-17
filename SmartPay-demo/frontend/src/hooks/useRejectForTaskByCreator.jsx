"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useRejectForTaskByCreator = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleRejectForTaskByCreator = async (taskId, solver) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.rejectForTaskByCreator(taskId, solver);
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
        "Task rejected by creator successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during rejecting task by creator",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleRejectForTaskByCreator };
};

export default useRejectForTaskByCreator;
