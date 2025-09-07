import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { AxiosError } from 'axios';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<any>,
  dependencies: any[] = [],
  options: UseApiOptions = { immediate: false }
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = async (...args: any[]): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiFunction(...args);
      const data = response.data;
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof AxiosError 
        ? error.response?.data?.message || error.message || 'An error occurred'
        : 'An unexpected error occurred';
      
      setState({ data: null, loading: false, error: errorMessage });
      return null;
    }
  };

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, dependencies);

  const refetch = () => execute();
  const reset = () => setState({ data: null, loading: false, error: null });

  return {
    ...state,
    execute,
    refetch,
    reset,
  };
}

// Specialized hooks for common API operations
export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const signup = useApi(apiService.auth.signup);
  const login = useApi(apiService.auth.login);
  const logout = useApi(apiService.auth.logout);

  const handleSignup = async (userData: { fullName: string; email: string; password: string; role?: 'client' | 'freelancer' }) => {
    const result = await signup.execute(userData);
    if (result?.token) {
      localStorage.setItem('authToken', result.token);
      setUser(result.user);
      setIsAuthenticated(true);
    }
    return result;
  };

  const handleLogin = async (credentials: { email: string; password: string }) => {
    const result = await login.execute(credentials);
    if (result?.token) {
      localStorage.setItem('authToken', result.token);
      setUser(result.user);
      setIsAuthenticated(true);
    }
    return result;
  };

  const handleLogout = async () => {
    await logout.execute();
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const response = await apiService.auth.verifyToken();
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    user,
    isAuthenticated,
    signup: handleSignup,
    login: handleLogin,
    logout: handleLogout,
    loading: signup.loading || login.loading || logout.loading,
    error: signup.error || login.error || logout.error,
  };
}

export function useJobs() {
  const getAllJobs = useApi(apiService.jobs.getAllJobs);
  const createJob = useApi(apiService.jobs.createJob);
  const updateJob = useApi(apiService.jobs.updateJob);
  const deleteJob = useApi(apiService.jobs.deleteJob);

  return {
    jobs: getAllJobs.data,
    loading: getAllJobs.loading,
    error: getAllJobs.error,
    fetchJobs: getAllJobs.execute,
    createJob: createJob.execute,
    updateJob: updateJob.execute,
    deleteJob: deleteJob.execute,
    refetch: getAllJobs.refetch,
  };
}

export default useApi;
