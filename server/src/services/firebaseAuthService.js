const { auth } = require('../config/firebase');
const logger = require('../utils/logger');

class FirebaseAuthService {
  /**
   * Create a Firebase user (this will automatically send verification email)
   */
  async createUser(email, password, displayName) {
    try {
      if (!auth) {
        logger.warn('Firebase Auth not initialized, skipping Firebase user creation');
        return {
          uid: null,
          email: email,
          displayName: displayName,
          emailVerified: false,
          verificationLink: null
        };
      }

      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: displayName,
        emailVerified: false // This will trigger Firebase to send verification email
      });

      logger.info(`Firebase user created: ${userRecord.uid} for email: ${email}`);
      
      // Generate email verification link
      const verificationLink = await auth.generateEmailVerificationLink(email);
      
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        verificationLink: verificationLink
      };
    } catch (error) {
      logger.error('Firebase user creation error:', error);
      // Don't throw error, just return null Firebase data
      return {
        uid: null,
        email: email,
        displayName: displayName,
        emailVerified: false,
        verificationLink: null
      };
    }
  }

  /**
   * Verify a Firebase ID token
   */
  async verifyIdToken(idToken) {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      const decodedToken = await auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      logger.error('Firebase token verification error:', error);
      throw new Error(`Invalid Firebase token: ${error.message}`);
    }
  }

  /**
   * Generate email verification link
   */
  async generateEmailVerificationLink(email) {
    try {
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }
      const link = await auth.generateEmailVerificationLink(email);
      return link;
    } catch (error) {
      logger.error('Firebase email verification link error:', error);
      throw new Error(`Failed to generate verification link: ${error.message}`);
    }
  }
}

module.exports = new FirebaseAuthService();

module.exports = new FirebaseAuthService();
