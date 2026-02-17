"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useGetAllTasksByCreatorAndSolver = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleGetAllTasksByCreatorAndSolver = async (_creator, _solver) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.getAllTasksByCreatorAndSolver(
        _creator,
        _solver
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
        "Got all tasks by creator and solver successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during getting all tasks by creator and solver",
        "Error"
      );
      throw err;
    }
  };

  return { isLoading, handleGetAllTasksByCreatorAndSolver };
};

export default useGetAllTasksByCreatorAndSolver;
