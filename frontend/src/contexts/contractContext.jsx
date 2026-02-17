import React, { createContext, useContext, useState, useEffect } from "react";
import ContractInteractions from "@/utils/contractInteractions";
import config from "../../config/config.json";
import { useMetamask } from "@/hooks/useMetamask";

const ContractContext = createContext();

export const useContract = () => {
  return useContext(ContractContext);
};

export const ContractProvider = ({ children }) => {
  const [tasks, setTasks] = useState(null);
  const { state } = useMetamask();
  const { wallet, isMetamaskInstalled, chainId } = state;
  useEffect(() => {
    if (!tasks) {
      if (isMetamaskInstalled) {
        const contractInstance = new ContractInteractions(config);
        contractInstance.wallet(wallet);
        setTasks(contractInstance);
      }
    } else if (wallet) {
      tasks.wallet(wallet);
    }
    if (chainId) {
      const contractInstance = new ContractInteractions(config);
      contractInstance.wallet(wallet);
      setTasks(contractInstance);
    }
  }, [isMetamaskInstalled, wallet, chainId]);

  return (
    <ContractContext.Provider value={tasks}>
      {children}
    </ContractContext.Provider>
  );
};
