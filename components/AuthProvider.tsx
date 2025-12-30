'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const { user: currentUser } = await api.getMe();
        if (mounted) setUser(currentUser);
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, []);

  const login = async (email: string, pass: string) => {
    const { user } = await api.login(email, pass);
    setUser(user);
    router.push('/');
  };

  const register = async (name: string, email: string, pass: string) => {
    const { user } = await api.register(name, email, pass);
    setUser(user);
    router.push('/');
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    router.push('/signin');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
