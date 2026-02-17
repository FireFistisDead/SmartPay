"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useGetAllrequestForTaskByTask = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleGetAllrequestForTaskByTask = async (_id) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.getAllrequestForTaskByTask(_id);
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
        "Get all requestForTask by task successfully",
        "Success"
      );
      console.log(tx);
      setIsLoading(false);
      console.log("all requested user :", tx);
      var response = tx;
      response = response.filter(
        (item) => item != "0x0000000000000000000000000000000000000000"
      );
      console.log("all requested user :", response);
      return response;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during getting all requestForTask by task",
        "Error"
      );
      setIsLoading(false);
      return [];
    }
  };

  return { isLoading, handleGetAllrequestForTaskByTask };
};

export default useGetAllrequestForTaskByTask;
