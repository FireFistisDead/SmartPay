"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useGetAllTaskByNinorTypeOfTask = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleGetAllTaskByNinorTypeOfTask = async (_minorTypeOfTask) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.getAllTaskByNinorTypeOfTask(
        _minorTypeOfTask
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
        "Get all task by MinorTypeOfTask successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      const tempArray = [];
      if (tx[0].length === 0) return tempArray;
      for (let i = 0; i < tx[0].length; i++) {
        tempArray.push({
          address: tx[0][i],
          index: parseInt(tx[1][i]._hex, 16),
        });
      }
      return tempArray;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during getting all task by MinorTypeOfTask",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleGetAllTaskByNinorTypeOfTask };
};

export default useGetAllTaskByNinorTypeOfTask;
