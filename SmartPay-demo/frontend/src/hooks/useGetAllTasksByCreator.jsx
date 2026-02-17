"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useGetAllTasksByCreator = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleGetAllTasksByCreator = async (_creator) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.getAllTasksByCreator(_creator);
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
        "Get all tasks by creator successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during getting all tasks by creator",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleGetAllTasksByCreator };
};

export default useGetAllTasksByCreator;
