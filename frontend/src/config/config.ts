// Simple BASE_URL accessor
declare global {
  interface Window {
    ENV: {
      BASE_URL: string;
    };
  }
}

export const BASE_URL = `${window.location.origin}/api`;
