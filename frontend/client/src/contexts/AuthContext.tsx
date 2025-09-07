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
  // Separate loading flags so we only mark overall loading complete
  // when both Firebase and backend profile fetch are done.
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const loading = firebaseLoading || profileLoading;

  // API base URL - backend is running on port 3001
  const API_BASE = 'http://localhost:3001/api';


  const login = async (email: string, password: string, role: 'client' | 'freelancer') => {
    try {
      const response = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token in localStorage
      const payload = data.data || data;

// Store token in localStorage (from your version)
localStorage.setItem('authToken', payload.token || data.data.token);
localStorage.setItem('userRole', role);

// Store user profile (from main version + your approach)
const user = payload.user || data.data.user;
if (user) {
  localStorage.setItem('userProfile', JSON.stringify(user));
  setUserProfile(user);
}
setProfileLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, username: string, role: 'client' | 'freelancer') => {
    try {
      const response = await fetch(`${API_BASE}/api/users/signup`, {
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
        const response = await fetch(`${API_BASE}/api/users/google`, {
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
          throw new Error(data.message || 'Google login failed');
        }

        const payload = data.data || data;

        if (payload.token) localStorage.setItem('authToken', payload.token);
        localStorage.setItem('userRole', role);
        if (payload.user) {
          localStorage.setItem('userProfile', JSON.stringify(payload.user));
          setUserProfile(payload.user);
        }
        setProfileLoading(false);
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
  localStorage.removeItem('userProfile');
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const getCurrentUser = async () => {
    const token = localStorage.getItem('authToken');
    // If there's no token, nothing to fetch; mark profile loading done.
    if (!token) {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {

      const response = await fetch(`${API_BASE}/users/me`, {

        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('getCurrentUser response:', data);
      

      if (data && data.success && data.data && data.data.user) {
        console.log('User data received:', data.data.user);
        setUserProfile(data.data.user);
        localStorage.setItem('userProfile', JSON.stringify(data.data.user));
      } else {
        // If backend didn't return profile, fall back to stored profile
        const stored = localStorage.getItem('userProfile');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUserProfile(parsed);
          } catch (e) {
            console.error('Failed to parse stored userProfile', e);
          }
        } else {
          // Invalid token, clear storage and profile
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
        }
      }
    } catch (error) {
      console.error('Get current user error:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
    } finally {
      setProfileLoading(false);
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
      setFirebaseLoading(false);
    });

    // Get current user profile from backend
    // getCurrentUser updates profileLoading flag internally
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
