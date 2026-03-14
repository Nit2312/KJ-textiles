'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { registerUser, loginUser, logoutUser, getUserData } from '@/lib/auth';
import { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await getUserData(firebaseUser.uid);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await loginUser(email, password);
      // Wait for onAuthStateChanged to fire and update user state
      return new Promise<void>((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          try {
            if (firebaseUser) {
              const userData = await getUserData(firebaseUser.uid);
              setUser(userData);
              unsubscribe();
              resolve();
            }
          } catch (error) {
            unsubscribe();
            reject(error);
          }
        });
        // Timeout after 5 seconds
        setTimeout(() => {
          unsubscribe();
          reject(new Error('Login timeout'));
        }, 5000);
      });
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await registerUser(email, password);
      // Wait for onAuthStateChanged to fire and update user state
      return new Promise<void>((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          try {
            if (firebaseUser) {
              const userData = await getUserData(firebaseUser.uid);
              setUser(userData);
              unsubscribe();
              resolve();
            }
          } catch (error) {
            unsubscribe();
            reject(error);
          }
        });
        // Timeout after 5 seconds
        setTimeout(() => {
          unsubscribe();
          reject(new Error('Registration timeout'));
        }, 5000);
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
