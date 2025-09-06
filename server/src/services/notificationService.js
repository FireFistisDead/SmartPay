const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');
const User = require('../models/User');
const Job = require('../models/Job');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  async initialize() {
    try {
      if (config.email.smtp.auth.user && config.email.smtp.auth.pass) {
        this.transporter = nodemailer.createTransporter({
          host: config.email.smtp.host,
          port: config.email.smtp.port,
          secure: config.email.smtp.secure,
          auth: config.email.smtp.auth
        });

        // Verify connection
        await this.transporter.verify();
        logger.info('Email service initialized successfully');
      } else {
        logger.warn('Email credentials not configured');
      }
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Send job created notification
   */
  async sendJobCreatedNotification(event) {
    try {
      const job = await Job.findOne({ jobId: event.jobId }).lean();
      if (!job) return;

      const client = await User.findByAddress(job.client);
      if (!client || !client.email) return;

      const emailData = {
        to: client.email,
        subject: `Job Created Successfully - ${job.title}`,
        template: 'job-created',
        data: {
          clientName: client.displayName,
          jobTitle: job.title,
          jobId: job.jobId,
          totalAmount: job.totalAmount,
          milestonesCount: job.milestones.length,
          deadline: job.deadline,
          transactionHash: event.transactionHash
        }
      };

      await this.sendEmail(emailData);
      
      // Send WebSocket notification
      this.sendWebSocketNotification(job.client, {
        type: 'job_created',
        jobId: job.jobId,
        title: 'Job Created Successfully',
        message: `Your job "${job.title}" has been created and is now live.`,
        data: { jobId: job.jobId, transactionHash: event.transactionHash }
      });

    } catch (error) {
      logger.error('Error sending job created notification:', error);
    }
  }

  /**
   * Send job accepted notification
   */
  async sendJobAcceptedNotification(event) {
    try {
      const job = await Job.findOne({ jobId: event.jobId }).lean();
      if (!job) return;

      const [client, freelancer] = await Promise.all([
        User.findByAddress(job.client),
        User.findByAddress(event.eventData.freelancer)
      ]);

      // Notify client
      if (client && client.email && client.settings.emailNotifications.jobUpdates) {
        await this.sendEmail({
          to: client.email,
          subject: `Freelancer Assigned - ${job.title}`,
          template: 'job-accepted-client',
          data: {
            clientName: client.displayName,
            freelancerName: freelancer?.displayName || event.eventData.freelancer,
            jobTitle: job.title,
            jobId: job.jobId,
            freelancerProfile: freelancer?.profile,
            acceptedAt: event.timestamp
          }
        });
      }

      // Notify freelancer
      if (freelancer && freelancer.email && freelancer.settings.emailNotifications.jobUpdates) {
        await this.sendEmail({
          to: freelancer.email,
          subject: `Job Assignment Confirmed - ${job.title}`,
          template: 'job-accepted-freelancer',
          data: {
            freelancerName: freelancer.displayName,
            clientName: client?.displayName || job.client,
            jobTitle: job.title,
            jobId: job.jobId,
            totalAmount: job.totalAmount,
            milestonesCount: job.milestones.length,
            nextMilestone: job.milestones.find(m => m.status === 'pending')
          }
        });
      }

      // Send WebSocket notifications
      this.sendWebSocketNotification(job.client, {
        type: 'job_accepted',
        jobId: job.jobId,
        title: 'Freelancer Assigned',
        message: `${freelancer?.displayName || 'A freelancer'} has been assigned to your job "${job.title}".`,
        data: { jobId: job.jobId, freelancer: event.eventData.freelancer }
      });

      this.sendWebSocketNotification(event.eventData.freelancer, {
        type: 'job_accepted',
        jobId: job.jobId,
        title: 'Job Assignment Confirmed',
        message: `You have been assigned to the job "${job.title}".`,
        data: { jobId: job.jobId }
      });

    } catch (error) {
      logger.error('Error sending job accepted notification:', error);
    }
  }

  /**
   * Send milestone submitted notification
   */
  async sendMilestoneSubmittedNotification(event) {
    try {
      const job = await Job.findOne({ jobId: event.jobId }).lean();
      if (!job) return;

      const [client, freelancer] = await Promise.all([
        User.findByAddress(job.client),
        User.findByAddress(job.freelancer)
      ]);

      const milestone = job.milestones[event.eventData.milestoneIndex];
      if (!milestone) return;

      // Notify client
      if (client && client.email && client.settings.emailNotifications.milestoneUpdates) {
        await this.sendEmail({
          to: client.email,
          subject: `Milestone Submitted for Review - ${job.title}`,
          template: 'milestone-submitted',
          data: {
            clientName: client.displayName,
            freelancerName: freelancer?.displayName || job.freelancer,
            jobTitle: job.title,
            jobId: job.jobId,
            milestoneIndex: event.eventData.milestoneIndex + 1,
            milestoneDescription: milestone.description,
            milestoneAmount: milestone.amount,
            deliverableHash: event.eventData.deliverableHash,
            submittedAt: event.timestamp
          }
        });
      }

      // Send WebSocket notification
      this.sendWebSocketNotification(job.client, {
        type: 'milestone_submitted',
        jobId: job.jobId,
        title: 'Milestone Submitted',
        message: `Milestone ${event.eventData.milestoneIndex + 1} has been submitted for review.`,
        data: { 
          jobId: job.jobId, 
          milestoneIndex: event.eventData.milestoneIndex,
          deliverableHash: event.eventData.deliverableHash
        }
      });

    } catch (error) {
      logger.error('Error sending milestone submitted notification:', error);
    }
  }

  /**
   * Send milestone approved notification
   */
  async sendMilestoneApprovedNotification(event) {
    try {
      const job = await Job.findOne({ jobId: event.jobId }).lean();
      if (!job) return;

      const [client, freelancer] = await Promise.all([
        User.findByAddress(job.client),
        User.findByAddress(job.freelancer)
      ]);

      const milestone = job.milestones[event.eventData.milestoneIndex];
      if (!milestone) return;

      // Notify freelancer
      if (freelancer && freelancer.email && freelancer.settings.emailNotifications.milestoneUpdates) {
        await this.sendEmail({
          to: freelancer.email,
          subject: `Milestone Approved - Payment Released`,
          template: 'milestone-approved',
          data: {
            freelancerName: freelancer.displayName,
            clientName: client?.displayName || job.client,
            jobTitle: job.title,
            jobId: job.jobId,
            milestoneIndex: event.eventData.milestoneIndex + 1,
            milestoneDescription: milestone.description,
            amount: event.eventData.amount,
            approvedAt: event.timestamp,
            remainingMilestones: job.milestones.filter(m => m.status === 'pending').length
          }
        });
      }

      // Send WebSocket notifications
      this.sendWebSocketNotification(job.freelancer, {
        type: 'milestone_approved',
        jobId: job.jobId,
        title: 'Milestone Approved',
        message: `Milestone ${event.eventData.milestoneIndex + 1} has been approved and payment released.`,
        data: { 
          jobId: job.jobId, 
          milestoneIndex: event.eventData.milestoneIndex,
          amount: event.eventData.amount
        }
      });

      this.sendWebSocketNotification(job.client, {
        type: 'milestone_approved',
        jobId: job.jobId,
        title: 'Milestone Approved',
        message: `You have approved milestone ${event.eventData.milestoneIndex + 1}.`,
        data: { 
          jobId: job.jobId, 
          milestoneIndex: event.eventData.milestoneIndex,
          amount: event.eventData.amount
        }
      });

    } catch (error) {
      logger.error('Error sending milestone approved notification:', error);
    }
  }

  /**
   * Send job completed notification
   */
  async sendJobCompletedNotification(event) {
    try {
      const job = await Job.findOne({ jobId: event.jobId }).lean();
      if (!job) return;

      const [client, freelancer] = await Promise.all([
        User.findByAddress(job.client),
        User.findByAddress(job.freelancer)
      ]);

      // Notify both parties
      const parties = [
        { user: client, role: 'client' },
        { user: freelancer, role: 'freelancer' }
      ];

      for (const party of parties) {
        if (party.user && party.user.email && party.user.settings.emailNotifications.jobUpdates) {
          await this.sendEmail({
            to: party.user.email,
            subject: `Job Completed Successfully - ${job.title}`,
            template: 'job-completed',
            data: {
              userName: party.user.displayName,
              role: party.role,
              jobTitle: job.title,
              jobId: job.jobId,
              totalAmount: job.totalAmount,
              completedAt: event.timestamp,
              clientName: client?.displayName || job.client,
              freelancerName: freelancer?.displayName || job.freelancer
            }
          });
        }

        // Send WebSocket notification
        if (party.user) {
          this.sendWebSocketNotification(party.user.address, {
            type: 'job_completed',
            jobId: job.jobId,
            title: 'Job Completed',
            message: `The job "${job.title}" has been completed successfully.`,
            data: { jobId: job.jobId, totalAmount: job.totalAmount }
          });
        }
      }

    } catch (error) {
      logger.error('Error sending job completed notification:', error);
    }
  }

  /**
   * Send dispute raised notification
   */
  async sendDisputeRaisedNotification(event) {
    try {
      const job = await Job.findOne({ jobId: event.jobId }).lean();
      if (!job) return;

      const [client, freelancer, arbiter] = await Promise.all([
        User.findByAddress(job.client),
        User.findByAddress(job.freelancer),
        User.findByAddress(job.arbiter)
      ]);

      const raiser = await User.findByAddress(event.eventData.raiser);
      const isClientRaiser = event.eventData.raiser.toLowerCase() === job.client.toLowerCase();

      // Notify the other party
      const otherParty = isClientRaiser ? freelancer : client;
      if (otherParty && otherParty.email && otherParty.settings.emailNotifications.disputes) {
        await this.sendEmail({
          to: otherParty.email,
          subject: `Dispute Raised - ${job.title}`,
          template: 'dispute-raised-other-party',
          data: {
            userName: otherParty.displayName,
            raiserName: raiser?.displayName || event.eventData.raiser,
            jobTitle: job.title,
            jobId: job.jobId,
            reason: event.eventData.reason,
            raisedAt: event.timestamp
          }
        });
      }

      // Notify arbiter
      if (arbiter && arbiter.email) {
        await this.sendEmail({
          to: arbiter.email,
          subject: `New Dispute to Resolve - ${job.title}`,
          template: 'dispute-raised-arbiter',
          data: {
            arbiterName: arbiter.displayName,
            raiserName: raiser?.displayName || event.eventData.raiser,
            jobTitle: job.title,
            jobId: job.jobId,
            reason: event.eventData.reason,
            totalAmount: job.totalAmount,
            clientName: client?.displayName || job.client,
            freelancerName: freelancer?.displayName || job.freelancer,
            raisedAt: event.timestamp
          }
        });
      }

      // Send WebSocket notifications
      const addresses = [job.client, job.freelancer, job.arbiter].filter(Boolean);
      addresses.forEach(address => {
        this.sendWebSocketNotification(address, {
          type: 'dispute_raised',
          jobId: job.jobId,
          title: 'Dispute Raised',
          message: `A dispute has been raised for job "${job.title}".`,
          data: { 
            jobId: job.jobId, 
            raiser: event.eventData.raiser,
            reason: event.eventData.reason
          }
        });
      });

    } catch (error) {
      logger.error('Error sending dispute raised notification:', error);
    }
  }

  /**
   * Send dispute resolved notification
   */
  async sendDisputeResolvedNotification(event) {
    try {
      const job = await Job.findOne({ jobId: event.jobId }).lean();
      if (!job) return;

      const [client, freelancer, arbiter] = await Promise.all([
        User.findByAddress(job.client),
        User.findByAddress(job.freelancer),
        User.findByAddress(job.arbiter)
      ]);

      const winner = await User.findByAddress(event.eventData.winner);

      // Notify all parties
      const parties = [
        { user: client, role: 'client' },
        { user: freelancer, role: 'freelancer' }
      ];

      for (const party of parties) {
        if (party.user && party.user.email && party.user.settings.emailNotifications.disputes) {
          const isWinner = party.user.address.toLowerCase() === event.eventData.winner.toLowerCase();
          
          await this.sendEmail({
            to: party.user.email,
            subject: `Dispute Resolved - ${job.title}`,
            template: 'dispute-resolved',
            data: {
              userName: party.user.displayName,
              role: party.role,
              isWinner,
              winnerName: winner?.displayName || event.eventData.winner,
              arbiterName: arbiter?.displayName || job.arbiter,
              jobTitle: job.title,
              jobId: job.jobId,
              amount: event.eventData.amount,
              resolvedAt: event.timestamp
            }
          });
        }

        // Send WebSocket notification
        if (party.user) {
          const isWinner = party.user.address.toLowerCase() === event.eventData.winner.toLowerCase();
          this.sendWebSocketNotification(party.user.address, {
            type: 'dispute_resolved',
            jobId: job.jobId,
            title: 'Dispute Resolved',
            message: `The dispute for job "${job.title}" has been resolved${isWinner ? ' in your favor' : ''}.`,
            data: { 
              jobId: job.jobId, 
              winner: event.eventData.winner,
              amount: event.eventData.amount,
              isWinner
            }
          });
        }
      }

    } catch (error) {
      logger.error('Error sending dispute resolved notification:', error);
    }
  }

  /**
   * Send custom notification
   */
  async sendCustomNotification(address, notification) {
    try {
      const user = await User.findByAddress(address);
      
      if (user && user.email && notification.email) {
        await this.sendEmail({
          to: user.email,
          subject: notification.email.subject,
          template: notification.email.template || 'generic',
          data: {
            userName: user.displayName,
            ...notification.email.data
          }
        });
      }

      // Send WebSocket notification
      this.sendWebSocketNotification(address, notification.websocket || notification);

    } catch (error) {
      logger.error('Error sending custom notification:', error);
    }
  }

  /**
   * Send email using configured transporter
   */
  async sendEmail(emailData) {
    if (!this.transporter) {
      logger.warn('Email transporter not configured, skipping email notification');
      return;
    }

    try {
      const mailOptions = {
        from: config.email.from,
        to: emailData.to,
        subject: emailData.subject,
        html: await this.generateEmailHTML(emailData.template, emailData.data)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${emailData.to}: ${result.messageId}`);
      
      return result;

    } catch (error) {
      logger.error(`Failed to send email to ${emailData.to}:`, error);
      throw error;
    }
  }

  /**
   * Generate HTML content for email templates
   */
  async generateEmailHTML(template, data) {
    // Simple template generation - in production, use a proper template engine
    const templates = {
      'job-created': `
        <h2>Job Created Successfully</h2>
        <p>Hello ${data.clientName},</p>
        <p>Your job "${data.jobTitle}" has been created successfully and is now live on the platform.</p>
        <ul>
          <li><strong>Job ID:</strong> ${data.jobId}</li>
          <li><strong>Total Amount:</strong> ${data.totalAmount} USDC</li>
          <li><strong>Milestones:</strong> ${data.milestonesCount}</li>
          <li><strong>Deadline:</strong> ${new Date(data.deadline).toLocaleDateString()}</li>
        </ul>
        <p><strong>Transaction Hash:</strong> ${data.transactionHash}</p>
        <p>Freelancers can now apply to your job. You'll be notified when someone accepts it.</p>
      `,
      'milestone-approved': `
        <h2>Milestone Approved - Payment Released</h2>
        <p>Hello ${data.freelancerName},</p>
        <p>Great news! Milestone ${data.milestoneIndex} for "${data.jobTitle}" has been approved.</p>
        <ul>
          <li><strong>Amount Released:</strong> ${data.amount} USDC</li>
          <li><strong>Milestone:</strong> ${data.milestoneDescription}</li>
          <li><strong>Remaining Milestones:</strong> ${data.remainingMilestones}</li>
        </ul>
        <p>The payment has been released to your wallet. Keep up the great work!</p>
      `,
      'dispute-raised': `
        <h2>Dispute Raised</h2>
        <p>Hello,</p>
        <p>A dispute has been raised for job "${data.jobTitle}".</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p>The arbiter will review the case and make a decision. Please provide any additional information if needed.</p>
      `,
      'generic': `
        <h2>${data.title || 'Notification'}</h2>
        <p>Hello ${data.userName},</p>
        <p>${data.message}</p>
      `
    };

    return templates[template] || templates['generic'];
  }

  /**
   * Send WebSocket notification
   */
  sendWebSocketNotification(address, notification) {
    if (global.io) {
      // Send to specific user
      global.io.to(`user_${address.toLowerCase()}`).emit('notification', {
        ...notification,
        timestamp: new Date(),
        id: Date.now().toString()
      });
    }
  }

  /**
   * Get notification preferences for user
   */
  async getNotificationPreferences(address) {
    try {
      const user = await User.findByAddress(address);
      return user?.settings?.emailNotifications || {
        jobUpdates: true,
        milestoneUpdates: true,
        disputes: true,
        marketing: false
      };
    } catch (error) {
      logger.error('Error getting notification preferences:', error);
      return null;
    }
  }

  /**
   * Update notification preferences for user
   */
  async updateNotificationPreferences(address, preferences) {
    try {
      const user = await User.findByAddress(address);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.settings) {
        user.settings = {};
      }
      if (!user.settings.emailNotifications) {
        user.settings.emailNotifications = {};
      }

      Object.assign(user.settings.emailNotifications, preferences);
      await user.save();

      return user.settings.emailNotifications;
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  async getStatus() {
    try {
      const status = {
        email: {
          configured: !!this.transporter,
          working: false
        },
        websocket: {
          configured: !!global.io,
          working: !!global.io
        }
      };

      // Test email service
      if (this.transporter) {
        try {
          await this.transporter.verify();
          status.email.working = true;
        } catch (error) {
          status.email.error = error.message;
        }
      }

      return status;
    } catch (error) {
      logger.error('Error getting notification service status:', error);
      return { error: error.message };
    }
  }
}

module.exports = NotificationService;
