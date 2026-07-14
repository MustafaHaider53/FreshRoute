import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'FARMER' | 'BUYER' | 'DRIVER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (dto: { email: string; name: string; role: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for saved session on mount
    const savedToken = localStorage.getItem('freshroute_token');
    const savedUser = localStorage.getItem('freshroute_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: loggedUser } = response.data;
      
      setToken(accessToken);
      setUser(loggedUser);
      localStorage.setItem('freshroute_token', accessToken);
      localStorage.setItem('freshroute_user', JSON.stringify(loggedUser));
    } catch (error) {
      throw error;
    }
  };

  const register = async (dto: { email: string; name: string; role: string; password: string }) => {
    try {
      await api.post('/auth/register', dto);
      // Auto login after registration
      await login(dto.email, dto.password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('freshroute_token');
    localStorage.removeItem('freshroute_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
