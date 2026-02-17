"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useAcceptTaskForSolver = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleAcceptTaskForSolver = async (taskId, solver) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.acceptTaskForSolver(taskId, solver);
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
        "Task accepted by solver successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during accepting task by solver",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleAcceptTaskForSolver };
};

export default useAcceptTaskForSolver;
