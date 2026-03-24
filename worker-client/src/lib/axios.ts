import axios, { AxiosInstance } from "axios";

import {
  AUTH_URL,
  WORKER_API_URL,
} from "./utils";

const createInstance = (baseURL: string | undefined): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor — attach auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor — handle errors globally
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // handle unauthorized (e.g. redirect to login)
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const authApi   = createInstance(AUTH_URL);
export const workerApi = createInstance(WORKER_API_URL);