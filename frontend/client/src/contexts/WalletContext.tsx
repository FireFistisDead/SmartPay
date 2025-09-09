import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';

interface WalletContextValue {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // detect injected provider
    if ((window as any).ethereum) {
      const p = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(p);
      // do not auto-connect; wait for user action
    }
  }, []);

  const connect = async () => {
    if (!provider) {
      throw new Error('No injected provider found');
    }
    try {
      // request accounts
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const s = await provider.getSigner();
      const addr = await s.getAddress();
      setSigner(s);
      setAddress(addr);
      setProvider(provider);
    } catch (err) {
      console.error('Wallet connect failed', err);
      throw err;
    }
  };

  const disconnect = () => {
    setSigner(null);
    setAddress(null);
    // keep provider if available
  };

  return (
    <WalletContext.Provider value={{ provider, signer, address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

export default WalletContext;
