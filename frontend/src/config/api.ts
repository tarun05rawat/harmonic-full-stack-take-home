// API Configuration and utilities
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const fallbackUrl = "http://localhost:8000";

  const baseUrl = envUrl || fallbackUrl;

  if (!isValidUrl(baseUrl)) {
    throw new Error(`Invalid API base URL: ${baseUrl}`);
  }

  return baseUrl;
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  ENVIRONMENT: import.meta.env.MODE || "development",
  IS_DEVELOPMENT: import.meta.env.DEV === true,
  TIMEOUT: 10000, // 10 seconds
} as const;

export const buildApiUrl = (endpoint: string): string => {
  if (!endpoint || typeof endpoint !== "string") {
    throw new Error("Endpoint must be a non-empty string");
  }

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  return `${API_CONFIG.BASE_URL}${normalizedEndpoint}`;
};
