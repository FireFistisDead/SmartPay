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
      
      // DEMO MODE: Bypass wallet check
      console.log("DEMO MODE: Creating task without wallet requirement");
      
      const tx = await contractInstance.createTask(task);
      
      NotificationHandler(
        "SmartPay Demo",
        "Task created successfully! (No crypto required in demo)",
        "Success"
      );
      setIsLoading(false);
      return true;
      
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay Demo",
        "Error during task creating",
        "Error"
      );
      setIsLoading(false);
      throw err;
    }
  };

  return { isLoading, handleCreateTask };
};

export default useCreateTask;
