import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface ServerStatus {
  status: string;
  timestamp: string;
  message?: string;
}

const ApiTest: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test health endpoint
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      setServerStatus(data);
    } catch (err) {
      setError('Failed to connect to server. Make sure the backend is running on port 3001.');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testApiService = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test with API service
      const response = await apiService.analytics.getDashboard();
      console.log('API Service test successful:', response.data);
      setServerStatus({
        status: 'API Service Connected',
        timestamp: new Date().toISOString(),
        message: 'API endpoints are accessible'
      });
    } catch (err: any) {
      setError(`API Service error: ${err.response?.data?.message || err.message}`);
      console.error('API Service error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Frontend-Backend Connection Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Server Status</h3>
        {loading && <p>Testing connection...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {serverStatus && (
          <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
            <p><strong>Status:</strong> {serverStatus.status}</p>
            <p><strong>Timestamp:</strong> {serverStatus.timestamp}</p>
            {serverStatus.message && <p><strong>Message:</strong> {serverStatus.message}</p>}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testConnection}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Health Endpoint
        </button>
        
        <button 
          onClick={testApiService}
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test API Service
        </button>
      </div>

      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <h4>Connection Details:</h4>
        <ul>
          <li>Frontend: http://localhost:5173 (Vite dev server)</li>
          <li>Backend: http://localhost:3001 (Express server)</li>
          <li>API Base: http://localhost:3001/api</li>
          <li>CORS: Configured for cross-origin requests</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTest;
