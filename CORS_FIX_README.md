# CORS Configuration Fix for Live Website

This document explains how to fix CORS errors when deploying your SmartPay backend to a live server.

## What was changed:

1. **Updated CORS Configuration**: Modified the server to use dynamic CORS origins instead of hardcoded localhost URLs.

2. **Environment Variable Support**: Added support for the `ALLOWED_ORIGINS` environment variable to specify production domains.

3. **Enhanced CORS Handling**: Added explicit preflight request handling and more comprehensive CORS headers.

## Deployment Steps:

### 1. Set Environment Variables

Create a `.env` file in your server directory with the following variables:

```bash
# Required for production
NODE_ENV=production
ALLOWED_ORIGINS=https://your-live-domain.com,https://www.your-live-domain.com

# Example for common hosting platforms:
# Vercel: https://your-app.vercel.app
# Netlify: https://your-app.netlify.app
# Custom domain: https://your-domain.com,https://www.your-domain.com
```

### 2. Update Frontend Configuration

Make sure your frontend is pointing to the correct backend URL:

```bash
# In your frontend .env file
VITE_API_URL=https://your-backend-domain.com
```

### 3. Deploy to Production

Deploy your backend to your hosting platform (Railway, Heroku, AWS, etc.) and ensure the environment variables are set.

### 4. Test CORS

After deployment, test your CORS configuration by:

1. Opening your live website
2. Opening browser developer tools (F12)
3. Checking the Network tab for any CORS errors
4. Verifying API calls are successful

## Troubleshooting:

### Still getting CORS errors?

1. **Check Environment Variables**: Ensure `ALLOWED_ORIGINS` is set correctly on your production server.

2. **Verify Domain Format**: Make sure domains include the protocol (https://) and don't have trailing slashes.

3. **Check Server Logs**: Look for CORS-related error messages in your server logs.

4. **Browser Cache**: Clear your browser cache or try in an incognito window.

### Example Working Configuration:

```bash
# For a Vercel frontend and Railway backend
ALLOWED_ORIGINS=https://smartpay-frontend.vercel.app,https://www.smartpay-frontend.vercel.app
```

### Additional Security Notes:

- In production, avoid using wildcards (*) for origins
- Always use HTTPS in production
- Regularly review and update allowed origins
- Consider implementing additional security headers

## Files Modified:

- `server/src/server.js` - Updated CORS configuration
- `server/src/config/config.js` - Added dynamic CORS origin handling
- `server/.env.production.example` - Example production environment file

## Support:

If you continue to experience CORS issues, please check:
1. Your hosting platform's documentation for environment variable setup
2. Browser developer tools for specific error messages
3. Server logs for CORS-related errors
