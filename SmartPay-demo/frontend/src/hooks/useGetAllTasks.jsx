"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const getAllTasks = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleGetAllTasks = async () => {
    try {
      setIsLoading(true);
      
      // DEMO MODE: Get tasks from contract (returns mock data in demo)
      const tasks = await contractInstance.getAllTasks();
      
      if (tasks == "First Connect To Wallet") {
        NotificationHandler(
          "SmartPay Demo",
          "First Connect To Wallet",
          "Error"
        );
        setIsLoading(false);
        return [];
      }
      
      console.log("Tasks fetched:", tasks);
      setIsLoading(false);
      
      // Return the actual tasks array
      return Array.isArray(tasks) ? tasks : [];
      
    } catch (err) {
      console.log("Error during fetching tasks:", err.message);
      setIsLoading(false);
      return [];
    }
  };

  return { isLoading, handleGetAllTasks };
};

export default getAllTasks;
