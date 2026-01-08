import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const testAPI = {
  health: () => api.get('/health', { baseURL: 'http://localhost:3001' }),
  login: (matricId) => api.post('/auth/login', { 
    matricId, 
    signature: 'mock', 
    publicKey: 'rTestStudent123' 
  })
};

// Tokens API
export const tokensAPI = {
  mintTokens: async (wallet, amount) => {
    try {
      const response = await api.post('/tokens/mint', { wallet, amount });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  getBalance: async (wallet) => {
    try {
      const response = await api.get(`/tokens/balance/${wallet}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  burnTokens: async (wallet, amount) => {
    try {
      const response = await api.post('/tokens/burn', { wallet, amount });
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Seats API  
export const seatsAPI = {
  browseRooms: async () => {
    try {
      const response = await api.get('/seats/browse');
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  getRoomDetails: async (roomId) => {
    try {
      const response = await api.get(`/seats/room/${roomId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// NFT API
export const nftAPI = {
  mintNFT: async (wallet, roomId, duration) => {
    try {
      const response = await api.post('/nft/mint', { wallet, roomId, duration });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  verifyNFT: async (nftId) => {
    try {
      const response = await api.get(`/nft/verify/${nftId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  scanNFT: async (nftId) => {
    try {
      const response = await api.post(`/nft/scan/${nftId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  getUserBookings: async (wallet) => {
    try {
      const response = await api.get(`/nft/user/${wallet}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Analytics API
export const analyticsAPI = {
  getDashboard: async (opts = {}) => {
    try {
      const { start, end } = opts;
      const params = {};
      if (start) params.start = start;
      if (end) params.end = end;
      const response = await api.get('/analytics/dashboard', { params });
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default api;