"use client";
import "@/styles/globals.css";
import { Inter } from "next/font/google";
import Footer from "@/components/Footer";
import DemoBanner from "@/components/DemoBanner";
const inter = Inter({ subsets: ["latin"] });
import { ContractProvider } from "@/contexts/contractContext";
import { MetamaskProvider } from "@/hooks/useMetamask";
import { NotificationContextProvider } from "@/contexts/Notification-context";
import Notifications from "@/components/notification/Notifications";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>SmartPay Demo - No Crypto Required</title>
        <meta name="description" content="Demo version - Create tasks without cryptocurrency funds" />
        <script src="/demo-utils.js" defer></script>
      </head>
      <body className={inter.className}>
        <MetamaskProvider>
          <NotificationContextProvider>
            <ContractProvider>
              <DemoBanner />
              {children}
              <Notifications />
            </ContractProvider>
          </NotificationContextProvider>
        </MetamaskProvider>
        <Footer />
      </body>
    </html>
  );
}
