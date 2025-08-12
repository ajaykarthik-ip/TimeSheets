"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 AuthContext: Checking authentication...');
        const response = await fetch(`${API_BASE}/auth/profile/`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ AuthContext: User is authenticated:', data.user);
          setUser(data.user);
        } else {
          console.log('❌ AuthContext: User not authenticated');
        }
      } catch (error) {
        console.log('❌ AuthContext: Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [API_BASE]);

  const login = (userData: User) => {
    console.log('✅ AuthContext: User logged in:', userData);
    setUser(userData);
  };

  const logout = async () => {
    try {
      console.log('🚪 AuthContext: Logging out...');
      await fetch(`${API_BASE}/auth/logout/`, {
        method: 'POST',
        credentials: 'include'
      });
      console.log('✅ AuthContext: Logout successful');
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}