import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';

/**
 * Auth hook — provides auth state and actions with navigation
 */
export function useAuth() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, isLoading, error, login, logout, updateUser, clearError } =
    useAuthStore();

  const handleLogin = useCallback(
    async (email, password) => {
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      }
      return result;
    },
    [login, navigate]
  );

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    updateUser,
    clearError,
  };
}
