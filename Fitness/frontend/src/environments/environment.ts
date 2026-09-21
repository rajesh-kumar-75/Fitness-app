const isLocal = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const environment = {
  production: true,
  apiUrl: isLocal ? 'http://localhost:5000/api/v1' : 'https://fitness-app-82e9.onrender.com/api/v1',
};
