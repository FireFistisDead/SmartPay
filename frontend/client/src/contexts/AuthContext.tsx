import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { User } from '@shared/schema';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  login: (email: string, password: string, role: 'client' | 'freelancer') => Promise<void>;
  signup: (email: string, password: string, username: string, role: 'client' | 'freelancer') => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: (role: 'client' | 'freelancer') => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // API base URL - backend is running on port 3001
  const API_BASE = 'http://localhost:3001/api';

  const login = async (email: string, password: string, role: 'client' | 'freelancer') => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      // Store token in localStorage
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('userRole', role);
      
      setUserProfile(data.data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, username: string, role: 'client' | 'freelancer') => {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username, role }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      // Store token and user data after signup
      localStorage.setItem('authToken', data.data.token);
      localStorage.setItem('userRole', role);
      setUserProfile(data.data.user);

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (role: 'client' | 'freelancer') => {
    try {
      const { signInWithGoogle } = await import('@/lib/firebase');
      const result = await signInWithGoogle();
      
      if (result.user) {
        // Send Google user data to backend
        const response = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            googleId: result.user.uid,
            email: result.user.email,
            username: result.user.displayName || result.user.email?.split('@')[0],
            role,
          }),
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message);
        }

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', role);
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { signOutUser } = await import('@/lib/firebase');
      await signOutUser();
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const getCurrentUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setUserProfile(data.data.user);
      } else {
        // Invalid token, clear storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
      }
    } catch (error) {
      console.error('Get current user error:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
    }
  };

  const updateProfile = async (profileData: any) => {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token');

    try {
      const response = await fetch(`${API_BASE}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      // Update the local user profile
      setUserProfile(data.data.user);
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    await getCurrentUser();
  };

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Get current user profile from backend
    getCurrentUser();

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
