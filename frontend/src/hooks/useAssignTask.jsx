"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useAssignTask = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleAssignTask = async (taskId, solver) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.assignTask(taskId, solver);
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
        "Assigned task to solver successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during assigning task to solver",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleAssignTask };
};

export default useAssignTask;
