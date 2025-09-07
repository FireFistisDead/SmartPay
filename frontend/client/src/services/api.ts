import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service object
export const apiService = {
  // Authentication endpoints
  auth: {

    // Traditional email/password authentication
    signup: (userData: { fullName: string; email: string; password: string; role?: 'client' | 'freelancer' }) =>
      apiClient.post('/users/signup', userData),
    login: (credentials: { email: string; password: string }) =>
      apiClient.post('/users/login', credentials),
    verifyEmail: (token: string) =>
      apiClient.post('/users/verify-email', { token }),
    resendVerification: (email: string) =>
      apiClient.post('/users/resend-verification', { email }),
    
    // Blockchain authentication
    blockchainLogin: (credentials: { email: string; password: string }) =>
      apiClient.post('/auth/login', credentials),
    register: (userData: { name: string; email: string; password: string; role?: string }) =>
      apiClient.post('/auth/register', userData),
    simpleRegister: (userData: { address: string; username?: string; email?: string; roles?: string[] }) =>
      apiClient.post('/users/simple-register', userData),
    logout: () => apiClient.post('/auth/logout'),
    verifyToken: () => apiClient.get('/auth/verify'),
    forgotPassword: (email: string) =>
      apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) =>
      apiClient.post('/auth/reset-password', { token, password }),
    getNonce: (address: string) =>
      apiClient.post('/users/auth/nonce', { address }),
  },

  // User endpoints
  users: {
    getProfile: () => apiClient.get('/users/profile'),
    updateProfile: (userData: any) => apiClient.put('/users/profile', userData),
    getUsers: (params?: any) => apiClient.get('/users', { params }),
    getUserById: (id: string) => apiClient.get(`/users/${id}`),
  },

  // Job endpoints
  jobs: {
    getAllJobs: (params?: any) => apiClient.get('/jobs', { params }),
    getJobById: (id: string) => apiClient.get(`/jobs/${id}`),
    createJob: (jobData: any) => apiClient.post('/jobs', jobData),
    updateJob: (id: string, jobData: any) => apiClient.put(`/jobs/${id}`, jobData),
    deleteJob: (id: string) => apiClient.delete(`/jobs/${id}`),
    acceptJob: (id: string) => apiClient.post(`/jobs/${id}/accept`),
    getMyJobs: () => apiClient.get('/jobs/my-jobs'),
    getFeaturedJobs: () => apiClient.get('/jobs/featured'),
    searchJobs: (query: string, filters?: any) =>
      apiClient.get('/jobs/search', { params: { query, ...filters } }),
    getJobStats: () => apiClient.get('/jobs/stats'),
  },

  // Milestone endpoints
  milestones: {
    getMilestones: (jobId?: string) =>
      apiClient.get('/milestones', { params: jobId ? { jobId } : {} }),
    getMilestoneById: (id: string) => apiClient.get(`/milestones/${id}`),
    createMilestone: (milestoneData: any) =>
      apiClient.post('/milestones', milestoneData),
    updateMilestone: (id: string, milestoneData: any) =>
      apiClient.put(`/milestones/${id}`, milestoneData),
    submitMilestone: (id: string, submissionData: any) =>
      apiClient.post(`/milestones/${id}/submit`, submissionData),
    approveMilestone: (id: string) => apiClient.post(`/milestones/${id}/approve`),
    rejectMilestone: (id: string, reason: string) =>
      apiClient.post(`/milestones/${id}/reject`, { reason }),
  },

  // Payment endpoints
  payments: {
    getPayments: (params?: any) => apiClient.get('/payments', { params }),
    createPayment: (paymentData: any) => apiClient.post('/payments', paymentData),
    getPaymentById: (id: string) => apiClient.get(`/payments/${id}`),
    processPayment: (id: string) => apiClient.post(`/payments/${id}/process`),
  },

  // Analytics endpoints
  analytics: {
    getDashboard: () => apiClient.get('/analytics/dashboard'),
    getJobAnalytics: (timeframe?: string) =>
      apiClient.get('/analytics/jobs', { params: { timeframe } }),
    getUserAnalytics: () => apiClient.get('/analytics/users'),
    getPaymentAnalytics: () => apiClient.get('/analytics/payments'),
  },

  // IPFS endpoints
  ipfs: {
    uploadFile: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post('/ipfs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    getFile: (hash: string) => apiClient.get(`/ipfs/file/${hash}`),
    pinFile: (hash: string) => apiClient.post(`/ipfs/pin/${hash}`),
  },

  // Dispute endpoints
  disputes: {
    getDisputes: (params?: any) => apiClient.get('/disputes', { params }),
    createDispute: (disputeData: any) => apiClient.post('/disputes', disputeData),
    getDisputeById: (id: string) => apiClient.get(`/disputes/${id}`),
    updateDispute: (id: string, disputeData: any) =>
      apiClient.put(`/disputes/${id}`, disputeData),
    resolveDispute: (id: string, resolution: any) =>
      apiClient.post(`/disputes/${id}/resolve`, resolution),
  },
};

export default apiClient;
