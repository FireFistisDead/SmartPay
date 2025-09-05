<h1 align="center">🛠️ Smart Contract Freelance Payment System</h1>  
<h3 align="center">🚀 Freelance Assurance Protocol</h3>  

<p align="center">
  <b>Team Name:</b> Galcogens <br>
  <b>Institute:</b> Chandubhai S. Patel Institute of Technology, CHARUSAT University  
</p>  

---

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/Polygon-8247E5?style=for-the-badge&logo=polygon&logoColor=white"/>
  <img src="https://img.shields.io/badge/IPFS-0A1B2B?style=for-the-badge&logo=ipfs&logoColor=65C2CB"/>
</p>  

---

## 📌 Overview  
The **Freelance Assurance Protocol** is a **blockchain-powered decentralized escrow system** designed to build trust between clients and freelancers.  

✨ With smart contracts on **Polygon**, it automates secure milestone-based payments while storing deliverables on **IPFS**.  
💡 This ensures **low-cost, transparent, and tamper-proof** freelance transactions.  

---

## 🚀 Key Features  
- 🔒 **Trustless Escrow** – Payments securely locked in smart contracts.  
- 📂 **IPFS Integration** – Decentralized file storage for deliverables.  
- ⚡ **Milestone-Based Payments** – Auto-release funds on approval.  
- 💳 **Wallet Integration** – Connect via MetaMask (React + Wagmi + Web3Modal).  
- 🛡️ **Secure & Reliable** – OpenZeppelin libraries + ReentrancyGuard.  
- ⚖️ **Dispute Resolution (Advanced)** – Arbiter role for conflict resolution.  
- ⭐ **On-Chain Reputation (Planned)** – Tamper-proof client/freelancer ratings.  

---

## 🏗️ Tech Stack  
| Layer         | Technologies |
|---------------|--------------|
| Blockchain    | Polygon (Amoy Testnet) |
| Smart Contract| Solidity, Hardhat, OpenZeppelin |
| Frontend      | React, Vite, Wagmi, Web3Modal |
| Storage       | IPFS (Pinata/Web3.storage) |
| Deployment    | Vercel (Frontend) + Polygon (Contracts) |

---

## 🔧 How It Works  
```mermaid
flowchart TD
    A[👨‍💼 Client Creates Job + Funds Escrow] --> B[👨‍💻 Freelancer Accepts Job]
    B --> C[📂 Deliverables Uploaded to IPFS]
    C --> D[✔️ Client Approves Milestone]
    D --> E[💰 Smart Contract Releases Payment]
