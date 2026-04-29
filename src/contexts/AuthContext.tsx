import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '../../types';
import * as authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;  // ✅ returns User
  register: (credentials: RegisterCredentials) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>; // Added Google Support
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      try {
        const sessionUser = await authService.getCurrentUser();
        if (sessionUser) {
          setUser(sessionUser);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

 const login = async (credentials: LoginCredentials) => {
    // setIsLoading(true);
    try {
      const loggedInUser = await authService.login(credentials);
      // Ensure the user state is set BEFORE anything else happens
          console.log('USER BEING SET IN CONTEXT:', loggedInUser); // ✅ add this

      setUser(loggedInUser); 
            return loggedInUser;

    } catch (error) {
      throw error;
    } finally {
      // Don't set loading false until the user state is solid
    setTimeout(() => setIsLoading(false), 50);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    // setIsLoading(true);
    try {
      // Note: If backend requires login after register, 
      // you might not set the user here.
      const newUser = await authService.register(credentials);
      setUser(newUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await authService.googleLogin(googleToken);
      setUser(loggedInUser);
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      authService.saveUserSession(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      register, 
      loginWithGoogle,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};