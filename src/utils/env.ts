/**
 * Environment variable helper that supports both build-time and runtime configuration
 */

declare global {
  interface Window {
    _env_?: {
      VITE_RCHAIN_HTTP_URL?: string;
      VITE_RCHAIN_GRPC_URL?: string;
      VITE_RCHAIN_READONLY_URL?: string;
    };
  }
}

export const getEnvVar = (key: string): string | undefined => {
  // First check runtime env (injected by Docker)
  if (window._env_ && window._env_[key as keyof typeof window._env_]) {
    return window._env_[key as keyof typeof window._env_];
  }
  
  // Fall back to build-time env
  return import.meta.env[key];
};

export const env = {
  RCHAIN_HTTP_URL: getEnvVar('VITE_RCHAIN_HTTP_URL') || 'http://localhost:40403',
  RCHAIN_GRPC_URL: getEnvVar('VITE_RCHAIN_GRPC_URL') || 'http://localhost:40401',
  RCHAIN_READONLY_URL: getEnvVar('VITE_RCHAIN_READONLY_URL') || 'http://localhost:40403',
};