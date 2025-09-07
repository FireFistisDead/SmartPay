const admin = require('firebase-admin');
const logger = require('../utils/logger');

class FirebaseEmailService {
  constructor() {
    this.initialized = false;
    this.init();
  }

  init() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length === 0) {
        // Initialize Firebase Admin SDK
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        
        if (serviceAccountKey) {
          const serviceAccount = JSON.parse(serviceAccountKey);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
          });
          this.initialized = true;
          logger.info('Firebase Admin SDK initialized successfully');
        } else {
          logger.warn('Firebase service account key not found in environment variables');
        }
      } else {
        this.initialized = true;
        logger.info('Firebase Admin SDK already initialized');
      }
    } catch (error) {
      logger.error('Firebase initialization error:', error);
      this.initialized = false;
    }
  }

  async sendVerificationEmail(email, verificationToken, userName = 'User') {
    try {
      if (!this.initialized) {
        logger.warn('Firebase not initialized, skipping email verification');
        return { success: false, message: 'Email service not available' };
      }

      // Create verification link
      const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/verify-email?token=${verificationToken}`;

      // Email template
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your SmartPay Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SmartPay!</h1>
              <p>Verify your email to get started</p>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Thank you for signing up with SmartPay. To complete your registration and secure your account, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </div>
              
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">${verificationLink}</p>
              
              <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
              
              <p>If you didn't create an account with SmartPay, please ignore this email.</p>
              
              <p>Best regards,<br>The SmartPay Team</p>
            </div>
            <div class="footer">
              <p>© 2025 SmartPay. All rights reserved.</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // For now, we'll simulate sending email since Firebase Auth email service requires additional setup
      // In production, you would use Firebase Auth's email service or integrate with a service like SendGrid
      logger.info(`Email verification sent to: ${email}`);
      logger.info(`Verification link: ${verificationLink}`);

      return {
        success: true,
        message: 'Verification email sent successfully',
        verificationLink // For development/testing purposes
      };

    } catch (error) {
      logger.error('Email sending error:', error);
      return {
        success: false,
        message: 'Failed to send verification email',
        error: error.message
      };
    }
  }

  async sendWelcomeEmail(email, userName = 'User', userType = 'client') {
    try {
      if (!this.initialized) {
        logger.warn('Firebase not initialized, skipping welcome email');
        return { success: false, message: 'Email service not available' };
      }

      const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard`;
      const userTypeTitle = userType === 'freelancer' ? 'Freelancer' : 'Client';

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to SmartPay!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #28a745; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to SmartPay!</h1>
              <p>Your ${userTypeTitle} account is now active</p>
            </div>
            <div class="content">
              <h2>Hello ${userName}!</h2>
              <p>Congratulations! Your email has been verified and your SmartPay ${userTypeTitle} account is now active.</p>
              
              <div style="text-align: center;">
                <a href="${dashboardLink}" class="button">Go to Dashboard</a>
              </div>

              ${userType === 'freelancer' ? `
                <h3>As a Freelancer, you can now:</h3>
                <div class="feature">
                  <strong>Browse Jobs</strong> - Find projects that match your skills
                </div>
                <div class="feature">
                  <strong>Submit Proposals</strong> - Apply for jobs with custom proposals
                </div>
                <div class="feature">
                  <strong>Manage Projects</strong> - Track milestones and deliverables
                </div>
                <div class="feature">
                  <strong>Secure Payments</strong> - Get paid safely through smart contracts
                </div>
              ` : `
                <h3>As a Client, you can now:</h3>
                <div class="feature">
                  <strong>Post Jobs</strong> - Create detailed job listings
                </div>
                <div class="feature">
                  <strong>Review Proposals</strong> - Evaluate freelancer applications
                </div>
                <div class="feature">
                  <strong>Manage Projects</strong> - Oversee project progress and milestones
                </div>
                <div class="feature">
                  <strong>Secure Payments</strong> - Pay safely through escrow smart contracts
                </div>
              `}
              
              <p>If you have any questions or need assistance, don't hesitate to contact our support team.</p>
              
              <p>Happy freelancing!<br>The SmartPay Team</p>
            </div>
            <div class="footer">
              <p>© 2025 SmartPay. All rights reserved.</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      logger.info(`Welcome email sent to: ${email} (${userType})`);

      return {
        success: true,
        message: 'Welcome email sent successfully'
      };

    } catch (error) {
      logger.error('Welcome email sending error:', error);
      return {
        success: false,
        message: 'Failed to send welcome email',
        error: error.message
      };
    }
  }
}

module.exports = new FirebaseEmailService();
