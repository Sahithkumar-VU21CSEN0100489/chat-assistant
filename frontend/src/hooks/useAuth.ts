import { useState, useEffect } from 'react';
import { User, getCurrentUser, isAuthenticated } from '../utils/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        setUser(getCurrentUser());
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const updateAuthState = (newUser: User | null) => {
    setUser(newUser);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    updateAuthState
  };
};