import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  ActionCodeSettings
} from 'firebase/auth';
import { auth } from './config';

export interface FirebaseAuthResult {
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}

class FirebaseAuthService {
  /**
   * Create user with email and password
   */
  async createUser(email: string, password: string): Promise<FirebaseAuthResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error: any) {
      console.error('Firebase create user error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(user: FirebaseUser): Promise<{ success: boolean; error?: string }> {
    try {
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/email-verified`, // Redirect URL after verification
        handleCodeInApp: true
      };

      await sendEmailVerification(user, actionCodeSettings);
      return { success: true };
    } catch (error: any) {
      console.error('Firebase send verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<FirebaseAuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error: any) {
      console.error('Firebase sign in error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error('Firebase sign out error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current Firebase user
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/reset-password`, // Redirect URL after password reset
        handleCodeInApp: true
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      return { success: true };
    } catch (error: any) {
      console.error('Firebase send password reset error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Confirm password reset with code
   */
  async confirmPasswordReset(code: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      await confirmPasswordReset(auth, code, newPassword);
      return { success: true };
    } catch (error: any) {
      console.error('Firebase confirm password reset error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if current user's email is verified
   */
  isEmailVerified(): boolean {
    const user = this.getCurrentUser();
    return user ? user.emailVerified : false;
  }

  /**
   * Reload current user to get latest verification status
   */
  async reloadUser(): Promise<void> {
    const user = this.getCurrentUser();
    if (user) {
      await user.reload();
      console.log('Firebase user reloaded. Email verified:', user.emailVerified);
    } else {
      console.log('No current Firebase user to reload');
    }
  }

  /**
   * Get detailed user info for debugging
   */
  getUserDebugInfo(): any {
    const user = this.getCurrentUser();
    if (user) {
      return {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        isAnonymous: user.isAnonymous
      };
    }
    return null;
  }
}

export default new FirebaseAuthService();
