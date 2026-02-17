"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useGetTaskByrequestForTask = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleGetTaskByrequestForTask = async (_requestForTask) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.getTaskByrequestForTask(
        _requestForTask
      );
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
        "Get task by requestForTask successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during getting task by requestForTask",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleGetTaskByrequestForTask };
};

export default useGetTaskByrequestForTask;
