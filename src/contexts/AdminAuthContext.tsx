import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminAuthContextType {
  isAdmin: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface AdminAuthProviderProps {
  children: ReactNode;
}

const ADMIN_TOKEN_KEY = 'admin_auth_token';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'; // Default for development

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing auth token on mount
  useEffect(() => {
    console.log('[AdminAuth] Checking for existing token on mount...');
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    console.log('[AdminAuth] Token from localStorage:', token ? 'Found' : 'Not found');
    
    if (token) {
      // Verify token is valid (simple check - in production, you'd validate with backend)
      try {
        console.log('[AdminAuth] Attempting to decode token...');
        const tokenData = JSON.parse(atob(token));
        console.log('[AdminAuth] Decoded token data:', tokenData);
        
        const expiresAt = tokenData.expiresAt;
        const currentTime = Date.now();
        
        console.log('[AdminAuth] Token expires at:', new Date(expiresAt).toLocaleString());
        console.log('[AdminAuth] Current time:', new Date(currentTime).toLocaleString());
        console.log('[AdminAuth] Token valid:', expiresAt && currentTime < expiresAt);
        
        if (expiresAt && currentTime < expiresAt) {
          console.log('[AdminAuth] Token is valid, setting isAdmin to true');
          setIsAdmin(true);
        } else {
          console.log('[AdminAuth] Token expired, clearing it');
          localStorage.removeItem(ADMIN_TOKEN_KEY);
        }
      } catch (error) {
        console.error('[AdminAuth] Error parsing token:', error);
        // Invalid token format, clear it
        localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
    }
    
    // Token validation complete, set loading to false
    console.log('[AdminAuth] Token validation complete, setting isLoading to false');
    setIsLoading(false);
  }, []);

  const login = async (password: string): Promise<boolean> => {
    // Simulate async authentication (in production, this would call your backend)
    return new Promise((resolve) => {
      setTimeout(() => {
        if (password === ADMIN_PASSWORD) {
          // Generate a simple token (in production, this would come from backend)
          const tokenData = {
            authenticated: true,
            timestamp: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          };
          const token = btoa(JSON.stringify(tokenData));
          
          localStorage.setItem(ADMIN_TOKEN_KEY, token);
          setIsAdmin(true);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 300); // Simulate network delay
    });
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setIsAdmin(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Custom hook to use the AdminAuth context
export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
