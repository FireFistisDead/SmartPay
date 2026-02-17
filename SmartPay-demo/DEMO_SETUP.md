# 🚀 SmartPay Demo - Complete Setup Guide

This guide will help you get the SmartPay demo version running in minutes **without any cryptocurrency requirements**.

## 📋 Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js installed (v16 or higher) - [Download here](https://nodejs.org/)
- [ ] npm (comes with Node.js)
- [ ] MongoDB (local or MongoDB Atlas account) - [Get free account](https://www.mongodb.com/cloud/atlas)
- [ ] A code editor (VS Code recommended)
- [ ] Terminal/Command Prompt access

### Verify Installation
```bash
node --version    # Should show v16.x.x or higher
npm --version     # Should show 8.x.x or higher
```

## 🎯 Step-by-Step Setup

### Step 1: Navigate to Demo Folder
```bash
cd SmartPay-demo
```

### Step 2: Backend Setup

#### 2.1 Install Backend Dependencies
```bash
cd backend
npm install
```

#### 2.2 Configure Backend Environment

Create a file named `.env` in the `backend/` folder with:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/smartpay-demo
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartpay-demo

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development
```

**Quick MongoDB Setup Options:**

**Option A: Local MongoDB**
```bash
# If you have MongoDB installed locally
# Default connection: mongodb://localhost:27017/smartpay-demo
```

**Option B: MongoDB Atlas (Free Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string
5. Replace `MONGODB_URI` in `.env`

#### 2.3 Start Backend Server
```bash
npm start
```

You should see:
```
Server running on port 5000
MongoDB Connected Successfully
```

✅ **Backend is ready!** Keep this terminal open.

### Step 3: Frontend Setup

Open a **new terminal** window.

#### 3.1 Navigate to Frontend
```bash
cd frontend
```

#### 3.2 Install Frontend Dependencies
```bash
npm install
```

This may take a few minutes. Go grab a coffee! ☕

#### 3.3 Configure Frontend Environment

Create a file named `.env.local` in the `frontend/` folder with:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

# Demo Mode Flag (optional)
NEXT_PUBLIC_DEMO_MODE=true

# App Title
NEXT_PUBLIC_APP_NAME=SmartPay Demo
```

#### 3.4 Start Frontend Development Server
```bash
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

✅ **Frontend is ready!**

### Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

🎉 **You should see the SmartPay demo homepage!**

## ✨ Testing the Demo

### Create Your First Task (No Wallet Required!)

1. **Navigate to "Create New Job"**
   - Click on the navigation menu
   - Select "Create New Job" or "Post a Job"

2. **Fill in Task Details**
   ```
   Title: Test Website Design
   Description: Create a modern landing page for a startup
   Reward: 5 (simulated - no real cost!)
   Time to Complete: 7 days
   Major Type: Design
   Minor Type: Website Design
   Tech Stack: HTML, CSS, JavaScript, React
   ```

3. **Submit**
   - Click "Submit" or "Create Task"
   - ✅ No wallet popup!
   - ✅ No MetaMask required!
   - ✅ No funds needed!
   - Success notification appears instantly

4. **View Your Task**
   - Browse to the relevant category
   - See your newly created task

## 🔍 Troubleshooting

### Problem: Backend won't start

**Error: "Cannot connect to MongoDB"**
```bash
# Solution 1: Check MongoDB is running
# For local MongoDB:
mongod

# Solution 2: Check .env file
# Make sure MONGODB_URI is correct
```

**Error: "Port 5000 already in use"**
```bash
# Solution: Change port in backend/.env
PORT=5001

# Update frontend/.env.local accordingly
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
```

### Problem: Frontend won't start

**Error: "Module not found"**
```bash
# Solution: Reinstall dependencies
cd frontend
rm -rf node_modules
npm install
```

**Error: "Port 3000 already in use"**
```bash
# Solution: Use different port
npm run dev -- -p 3001
# Access at http://localhost:3001
```

### Problem: Tasks not appearing

**Check:**
1. Backend is running (terminal should be active)
2. Frontend is running (terminal should be active)
3. Browser console for errors (F12 → Console)
4. Network requests (F12 → Network tab)

## 🎮 Demo Features to Try

### 1. Task Management
- ✅ Create tasks (free, no wallet)
- ✅ Browse by category
- ✅ View task details
- ✅ Search functionality

### 2. User Profile
- ✅ Create profile
- ✅ View profile
- ✅ Upload avatar
- ✅ Edit details

### 3. Review System
- ✅ Leave reviews
- ✅ Rate submissions
- ✅ View ratings

### 4. Categories
- Design
  - Website Design
  - Logo Design
  - Mobile App Design
  - T-shirt Design
  - And more...
- Development
  - Website Making
  - Full-stack projects

## 📊 What's Different from Production?

| Action | Demo Mode | Production Mode |
|--------|-----------|-----------------|
| Create Task | ✅ Free, instant | ❌ Requires 3 ETH |
| Wallet | ❌ Not needed | ✅ MetaMask required |
| Payments | 🎭 Simulated | 💰 Real crypto |
| Data Storage | 📦 MongoDB | 📦 MongoDB + Blockchain |

## 🔄 Stopping the Application

### Stop Frontend
In the frontend terminal:
```bash
Ctrl + C
```

### Stop Backend
In the backend terminal:
```bash
Ctrl + C
```

## 🚀 Restarting the Application

### Quick Restart (after initial setup)

**Terminal 1 - Backend:**
```bash
cd SmartPay-demo/backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd SmartPay-demo/frontend
npm run dev
```

## 📝 Environment Files Quick Reference

### backend/.env
```env
MONGODB_URI=mongodb://localhost:27017/smartpay-demo
PORT=5000
NODE_ENV=development
```

### frontend/.env.local
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_APP_NAME=SmartPay Demo
```

## 🎯 Next Steps

1. **Explore the UI**
   - Try all features
   - Create multiple tasks
   - Test different categories

2. **Customize**
   - Add your own categories
   - Modify styling
   - Add features

3. **Present**
   - Perfect for demos
   - No crypto setup needed
   - Show full functionality

## 🆘 Still Having Issues?

1. **Check all terminals are running**
2. **Verify .env files exist and have correct values**
3. **Clear browser cache** (Ctrl + Shift + Delete)
4. **Restart both backend and frontend**
5. **Check MongoDB connection**

## 📞 Common Commands Reference

```bash
# Install dependencies
npm install

# Start backend
cd backend && npm start

# Start frontend
cd frontend && npm run dev

# Check if running
# Backend: http://localhost:5000
# Frontend: http://localhost:3000

# View logs
# Check terminal output for errors
```

## ✅ Success Checklist

- [ ] Backend terminal shows "Server running on port 5000"
- [ ] Backend terminal shows "MongoDB Connected"
- [ ] Frontend terminal shows "ready - started server"
- [ ] Browser opens http://localhost:3000
- [ ] Homepage loads without errors
- [ ] Can create a task without wallet
- [ ] Can browse categories
- [ ] No cryptocurrency-related errors

---

🎉 **Congratulations!** You now have a fully functional SmartPay demo running without any cryptocurrency requirements!

**Remember**: This is a demo version. For production use with real blockchain integration, refer to the main SmartPay project.
