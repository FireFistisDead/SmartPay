# SmartPay Deployment Guide

## Backend Deployment (Render) ✅ COMPLETED
Your backend is already deployed at: **https://smartpay-2qq5.onrender.com**

### CORS Configuration Updated:
- ✅ Added your Render backend URL to allowed origins
- ✅ Added pattern matching for common hosting platforms (Vercel, Netlify, etc.)
- ✅ Maintained localhost support for development

## Frontend Deployment Instructions

### Option 1: Deploy to Vercel (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy from frontend directory**:
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variables** in Vercel dashboard:
   - `VITE_API_URL` = `https://smartpay-2qq5.onrender.com`
   - `VITE_APP_NAME` = `SmartPay`
   - `VITE_NODE_ENV` = `production`

### Option 2: Deploy to Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy**:
   ```bash
   cd frontend
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Set Environment Variables** in Netlify dashboard:
   - `VITE_API_URL` = `https://smartpay-2qq5.onrender.com`

### Option 3: Deploy to Render

1. Connect your GitHub repository to Render
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables as above

## Testing Your Deployment

### 1. Test Backend CORS
Run the test script from your server directory:
```bash
cd server
node test-cors.js
```

### 2. Test Frontend Connection
1. Open your deployed frontend URL
2. Open browser developer tools (F12)
3. Check Console and Network tabs for errors
4. Try making API calls to verify connectivity

## Environment Variables Summary

### Backend (Render):
```bash
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
MONGODB_URI=your_mongodb_connection_string
```

### Frontend (Vercel/Netlify):
```bash
VITE_API_URL=https://smartpay-2qq5.onrender.com
VITE_APP_NAME=SmartPay
VITE_NODE_ENV=production
```

## Troubleshooting

### Common Issues:

1. **CORS Still Blocked**:
   - Check environment variables are set correctly
   - Verify your frontend domain is in ALLOWED_ORIGINS
   - Clear browser cache

2. **API Calls Failing**:
   - Verify VITE_API_URL is correct
   - Check if backend is running: https://smartpay-2qq5.onrender.com/health

3. **Build Errors**:
   - Ensure all dependencies are installed
   - Check build logs for specific errors

### Quick Health Check:
Visit: https://smartpay-2qq5.onrender.com/health

Expected response:
```json
{
  "status": "OK",
  "timestamp": "...",
  "environment": "production",
  "uptime": "...",
  "services": { ... }
}
```

## Next Steps:

1. **Deploy your frontend** using one of the options above
2. **Update ALLOWED_ORIGINS** on Render with your frontend URL
3. **Test the complete flow** from frontend to backend
4. **Monitor logs** for any issues

Your CORS configuration is now production-ready! 🚀
