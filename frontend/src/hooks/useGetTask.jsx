"use client";

import { useContract } from "@/contexts/contractContext";
import { useState } from "react";
import { useNotification } from "./useNotification";

const useGetTask = () => {
  const { NotificationHandler } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const contractInstance = useContract();

  const handleGetTask = async (taskId) => {
    try {
      setIsLoading(true);
      const tx = await contractInstance.getTask(taskId);
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
        "You have successfully fetched the task",
        "Success"
      );
      console.log(tx);
      var dummyData = {
        id: 1,
        title: "",
        description: "",
        reward: 0,
        timeToComplete: 0,
        majorTypeOfTask: "",
        minorTypeOfTask: "",
        techStack: "",
        creator: "",
        solver: "",
        sender: "",
        createdAt: 0,
        isUserRequestForTask: false,
      };
      dummyData.id = tx[0][0].toNumber();
      dummyData.reward = tx[0][1].toNumber();
      dummyData.createdAt = tx[0][2].toNumber();
      dummyData.timeToComplete = tx[0][3].toNumber();

      dummyData.creator = tx[1][0];
      dummyData.solver = tx[1][1];
      dummyData.sender = tx[1][2];

      dummyData.title = tx[2][0];
      dummyData.description = tx[2][1];
      dummyData.majorTypeOfTask = tx[2][2];
      dummyData.minorTypeOfTask = tx[2][3];
      dummyData.techStack = tx[2][4];

      dummyData.isUserRequestForTask = tx[3];

      setIsLoading(false);
      return dummyData;
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      NotificationHandler(
        "SmartPay",
        "Error during task creating",
        "Error"
      );
      setIsLoading(false);
      return {
        id: 1,
        title: "",
        description: "",
        reward: 0,
        timeToComplete: 0,
        majorTypeOfTask: "",
        minorTypeOfTask: "",
        techStack: "",
        creator: "",
        solver: "",
        sender: "",
        createdAt: 0,
        isUserRequestForTask: false,
      };
    }
  };

  return { isLoading, handleGetTask };
};

export default useGetTask;
