const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  async init() {
    try {
      // Create Gmail SMTP transporter
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'yashco.ltd@gmail.com',
          pass: process.env.EMAIL_PASS || 'Y@sh1234'
        }
      });

      // Verify connection
      await this.transporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Email service initialization failed:', error.message);
      this.transporter = null;
    }
  }

  async sendVerificationEmail(userEmail, fullName, verificationToken) {
    if (!this.transporter) {
      logger.error('Email service not available');
      return false;
    }

    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: {
          name: 'SmartPay',
          address: process.env.EMAIL_USER || 'yashco.ltd@gmail.com'
        },
        to: userEmail,
        subject: 'Welcome to SmartPay - Verify Your Email',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">SmartPay</div>
              <p>Secure Freelance Payment Platform</p>
            </div>
            <div class="content">
              <h2>Welcome to SmartPay, ${fullName}!</h2>
              <p>Thank you for joining SmartPay, the secure platform for freelance payments and project management.</p>
              
              <p>To get started, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="background: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all;">
                ${verificationUrl}
              </p>
              
              <p><strong>What's next?</strong></p>
              <ul>
                <li>Complete your profile setup</li>
                <li>Browse available projects or post your own</li>
                <li>Connect with talented freelancers or clients</li>
                <li>Enjoy secure, escrow-based payments</li>
              </ul>
              
              <p>If you didn't create this account, please ignore this email.</p>
              
              <p>Best regards,<br>The SmartPay Team</p>
            </div>
            <div class="footer">
              <p>© 2025 SmartPay. All rights reserved.</p>
              <p>This email was sent from an automated system. Please do not reply.</p>
            </div>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${userEmail}:`, result.messageId);
      return true;
    } catch (error) {
      logger.error('Failed to send verification email:', error.message);
      return false;
    }
  }

  async sendWelcomeEmail(userEmail, fullName) {
    if (!this.transporter) {
      logger.error('Email service not available');
      return false;
    }

    try {
      const mailOptions = {
        from: {
          name: 'SmartPay',
          address: process.env.EMAIL_USER || 'yashco.ltd@gmail.com'
        },
        to: userEmail,
        subject: 'Welcome to SmartPay - Your Account is Ready!',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to SmartPay</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">SmartPay</div>
              <p>Secure Freelance Payment Platform</p>
            </div>
            <div class="content">
              <h2>Welcome to SmartPay, ${fullName}!</h2>
              <p>🎉 Your email has been verified and your account is now active!</p>
              
              <p>You're all set to start using SmartPay's secure freelance platform.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" class="button">Go to Dashboard</a>
              </div>
              
              <p><strong>What you can do now:</strong></p>
              <ul>
                <li>📝 Complete your profile and showcase your skills</li>
                <li>🔍 Browse available projects and submit proposals</li>
                <li>📋 Post your own projects and hire freelancers</li>
                <li>💰 Enjoy secure, blockchain-based escrow payments</li>
                <li>⭐ Build your reputation through completed projects</li>
              </ul>
              
              <p>Need help getting started? Check out our guides or contact our support team.</p>
              
              <p>Best regards,<br>The SmartPay Team</p>
            </div>
            <div class="footer">
              <p>© 2025 SmartPay. All rights reserved.</p>
            </div>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${userEmail}:`, result.messageId);
      return true;
    } catch (error) {
      logger.error('Failed to send welcome email:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
