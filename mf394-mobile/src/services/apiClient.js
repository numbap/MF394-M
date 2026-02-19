import axios from "axios";
import { tokenStorage } from "../utils/secureStore";

const API_BASE_URL =
  process.env.API_DOMAIN || process.env.API_BASE_URL || "https://ummyou.com";
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || "30000");

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired - clear it
      await tokenStorage.clearToken();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
