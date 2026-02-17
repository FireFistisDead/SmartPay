"use client";
import Wallet from "./Wallet";
import { useListen } from "@/hooks/useListen";
import { useMetamask } from "@/hooks/useMetamask";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
const Header = () => {
  const { dispatch } = useMetamask();
  const listen = useListen();

  useEffect(() => {
    if (typeof window !== undefined) {
      const ethereumProviderInjected = typeof window.ethereum !== "undefined";

      const isMetamaskInstalled =
        ethereumProviderInjected && Boolean(window.ethereum.isMetaMask);

      const local = window.localStorage.getItem("metamaskState");

      if (local) {
        listen();
      }

      const { wallet, balance, chainId } = local
        ? JSON.parse(local)
        : { wallet: null, balance: null };

      dispatch({
        type: "pageLoaded",
        isMetamaskInstalled,
        wallet,
        balance,
        chainId,
      });
    }
  }, []);

  return (
    <nav
      style={{
        background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
        padding: "1.2rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        style={{
          color: "var(--white-color)",
          fontSize: "2rem",
          fontWeight: "700",
          letterSpacing: "0.05rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Link href={"/"} style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "inherit" }}>
          <span style={{ background: "linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Smart</span>Pay
        </Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <Link 
          href="/tasks" 
          style={{ 
            color: "white", 
            fontSize: "1rem", 
            fontWeight: "500",
            textDecoration: "none",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            transition: "all 0.3s ease",
            border: "2px solid transparent"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
            e.currentTarget.style.borderColor = "#3b82f6";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          📋 All Tasks
        </Link>
        <Link 
          href="/createNewJob" 
          style={{ 
            color: "white", 
            fontSize: "1rem", 
            fontWeight: "500",
            textDecoration: "none",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            background: "#3b82f6",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "#2563eb";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "#3b82f6";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          + Create Task
        </Link>
        <Wallet />
      </div>
    </nav>
  );
};

export default Header;
