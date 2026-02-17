import { useMetamask } from "./useMetamask";

export const useListen = () => {
  const { dispatch } = useMetamask();

  return () => {
    window.ethereum.on("accountsChanged", async (newAccounts) => {
      if (newAccounts.length > 0) {
        const newBalance = await window.ethereum?.request({
          method: "eth_getBalance",
          params: [newAccounts[0], "latest"],
        });
        const balanceInEther = parseInt(newBalance, 16) / 10 ** 18;
        const newChainId = await window.ethereum?.request({
          method: "eth_chainId",
        });

        dispatch({
          type: "connect",
          wallet: newAccounts[0],
          balance: balanceInEther.toFixed(4),
          chianId: parseInt(newChainId).toString(),
        });
      } else {
        dispatch({ type: "disconnect" });
      }
    });
    window.ethereum.on("chainChanged", async (newChainId) => {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      const newBalance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      });
      const balanceInEther = parseInt(newBalance, 16) / 10 ** 18;
      dispatch({
        type: "chainChanged",
        chainId: parseInt(newChainId).toString(),
        balance: balanceInEther.toFixed(4),
      });
    });
  };
};
