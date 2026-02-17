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
    // DEMO MODE: Create contract instance without wallet requirement
    console.log("DEMO MODE: Initializing contract interactions without wallet");
    
    if (!tasks) {
      const contractInstance = new ContractInteractions(config);
      // Set a demo wallet address if no real wallet is connected
      contractInstance.wallet(wallet || "0xDemoWallet");
      setTasks(contractInstance);
    } else if (wallet) {
      tasks.wallet(wallet);
    }
    
    if (chainId && wallet) {
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
