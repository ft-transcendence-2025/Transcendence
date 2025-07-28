const BASE_URL = "https://localhost:5000/api/auth";
import { request, getHeaders } from "../utils/api.js";
/* // Generic request wrapper function
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(BASE_URL + path, options);
  
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorData = await response.json();
      
      // Handle password validation errors (400 status with error array)
      if (errorData.error && Array.isArray(errorData.error)) {
        const firstError = errorData.error[0];
        if (firstError && firstError.message) {
          errorMessage = firstError.message;
        }
      }
      // Handle other error formats
      else if (errorData.message) {
        errorMessage = errorData.message;
      }
      else if (errorData.error) {
        errorMessage = String(errorData.error);
      }
    } catch (parseError) {
      console.log("Failed to parse error response:", parseError);
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json() as Promise<T>;
} */
// API functions
export const login = (body) => request(`${BASE_URL}/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
});
export const register = (body) => request(`${BASE_URL}/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
});
