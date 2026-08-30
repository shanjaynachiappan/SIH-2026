import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isMineController: boolean;
  isPlanner: boolean;
  isRegulator: boolean;
  isAdmin: boolean;
  canAccessCentral: boolean;
  canAccessLocal: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getCurrentUser());

  useEffect(() => {
    // Subscribe to auth state updates
    const unsubscribe = authService.subscribe((updatedUser) => {
      setUser(updatedUser);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await authService.login(email, pass);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isMineController = user !== null && user.role === 'MINE_CONTROLLER';
  const isPlanner = user !== null && user.role === 'PLANNER';
  const isRegulator = user !== null && user.role === 'REGULATOR';
  const isAdmin = user !== null && (user.role === 'ADMIN' || user.role === 'CENTRAL_ADMIN');
  const canAccessCentral = user !== null; // In this Central Dashboard project, all authenticated users have central access
  const canAccessLocal = user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isMineController,
        isPlanner,
        isRegulator,
        isAdmin,
        canAccessCentral,
        canAccessLocal,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
