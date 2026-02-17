"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useGetAllTasksByStatus = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleGetAllTasksByStatus = async (_status) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.getAllTasksByStatus(_status);
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
        "Got all tasks by status successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during getting all tasks by status",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleGetAllTasksByStatus };
};

export default useGetAllTasksByStatus;
